import { createContext, useContext, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Edges } from '@react-three/drei'
import { SILHOUETTE_VARIANTS, barsTexture, silhouetteTexture, worldUvBox } from './textures'
import { between, hash, random } from './chance'

const WARM = new THREE.Color('#ffb85c')
const UP = new THREE.Vector3(0, 1, 0)

// Scales lit windows: 1 at night, lower in daylight where interior lights barely show.
export const WindowGlow = createContext(1)

export function Solid({ size, color, cast = true, ...props }) {
  return (
    <mesh castShadow={cast} receiveShadow {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

// Box with a tiled texture that keeps its real-world scale on every face.
export function Wall({ size, texture, color = '#fff', ...props }) {
  const [w, h, d] = size
  const geometry = useMemo(() => worldUvBox(w, h, d), [w, h, d])
  return (
    <mesh geometry={geometry} castShadow receiveShadow {...props}>
      <meshStandardMaterial map={texture} color={color} roughness={0.9} />
    </mesh>
  )
}

// Flat ground patch lying on the plot (y is the small lift that avoids z-fighting).
export function Flat({ size, position, color, y = 0.02 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], y, position[1]]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  )
}

// Baluster railing drawn as one alpha-tested plane; `position` is the bottom centre.
export function Railing({ length, height = 1, position, rotationY = 0, color = '#1b1d21', topColor }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(length, height)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (length / 0.15))
    return g
  }, [length, height])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geometry} position={[0, height / 2, 0]}>
        <meshStandardMaterial map={barsTexture()} color={color} alphaTest={0.5} side={THREE.DoubleSide} />
      </mesh>
      {topColor && (
        <mesh position={[0, height, 0]}>
          <boxGeometry args={[length, 0.07, 0.09]} />
          <meshStandardMaterial color={topColor} />
        </mesh>
      )}
    </group>
  )
}

// Someone walking past behind a lit window, a little inside the room: crosses from one side to
// the other without stopping, then the window stays empty for a while. Each window has its own
// rhythm, and about a third of them never show anyone. Fades with the window's glow (`glass` is
// its material).
const PERSON = [0.7, 1.05] // silhouetteTexture() in metres
const WALK_SPEED = 0.7 // m/s

function Silhouette({ size, seed, glass, glowMax }) {
  const [w, h] = size
  const mat = useRef()
  // One texture per hair variant, cloned so each window can slide its own copy
  const textures = useMemo(
    () => Array.from({ length: SILHOUETTE_VARIANTS }, (_, i) => silhouetteTexture(i).clone()),
    [],
  )
  const r = (k) => random(seed + k)
  const period = between(r(1), 20, 60)
  const crossing = (w + 2 * PERSON[0]) / WALK_SPEED

  useFrame(({ clock }) => {
    const glow = glowMax > 0 ? Math.min(1, glass.current.emissiveIntensity / glowMax) : 0
    const m = mat.current
    const t = clock.elapsedTime + r(3) * period
    const cycle = Math.floor(t / period)
    const walked = t - cycle * period
    if (glow === 0 || walked > crossing) {
      m.opacity = 0
      return
    }
    // Who walks by this time, and which way
    const c = (k) => random(seed + cycle * 13 + k)
    const texture = textures[Math.floor(c(1) * SILHOUETTE_VARIANTS)]
    if (m.map !== texture) m.map = texture
    const dir = c(2) < 0.5 ? 1 : -1
    const headTop = Math.min(h * 0.85, 1.45) + between(c(3), -0.2, 0.05)
    const x = w / 2 + dir * (walked * WALK_SPEED - w / 2 - PERSON[0])
    const bob = Math.abs(Math.sin(walked * 5)) * 0.02
    // Facing the way they walk: a negative repeat mirrors the figure
    texture.repeat.set((dir * w) / PERSON[0], h / PERSON[1])
    texture.offset.set(0.5 - (dir * x) / PERSON[0], 1 - (headTop + bob) / PERSON[1])
    m.opacity = 0.55 * glow
  })

  return (
    <mesh position={[0, 0, 0.003]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={mat} map={textures[0]} color="#3a2412" transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

// Non-interactive window or door: frame + dark glass, optional stone lintel above.
// `lit` makes the glass glow warm (neighbours' lights), fading in and out; windows given a `lit`
// that are big enough to see into sometimes show someone inside.
// White casing and sill around a window, as on the siding of 6538.
function WindowTrim({ w, h }) {
  return (
    <>
      <mesh position={[0, 0, -0.008]}>
        <planeGeometry args={[w + 0.4, h + 0.4]} />
        <meshStandardMaterial color="#f7f6f1" />
      </mesh>
      <mesh position={[0, -h / 2 - 0.22, 0.04]} castShadow>
        <boxGeometry args={[w + 0.5, 0.06, 0.1]} />
        <meshStandardMaterial color="#f7f6f1" />
      </mesh>
    </>
  )
}

export function StaticWindow({ position, size, rotationY = 0, frame = '#2a2f36', glass = '#1c2733', lintel, lit, trim }) {
  const [w, h] = size
  const seed = useMemo(() => hash(position.join(',')), position)
  const occupied = lit !== undefined && w >= 0.55 && h >= 1.2 && random(seed) > 0.35
  const glassMat = useRef()
  const glow = useContext(WindowGlow)

  useFrame((_, dt) => {
    const m = glassMat.current
    const target = lit ? 2.2 * glow : 0
    if (m.emissiveIntensity === target) return
    m.emissiveIntensity = Math.abs(m.emissiveIntensity - target) < 0.01 ? target : THREE.MathUtils.lerp(m.emissiveIntensity, target, 1 - Math.exp(-dt * 3))
  })

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {trim && <WindowTrim w={w} h={h} />}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[w + 0.16, h + 0.16]} />
        <meshStandardMaterial color={frame} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial ref={glassMat} color={glass} roughness={0.25} metalness={0.2} emissive={WARM} emissiveIntensity={0} toneMapped={false} />
      </mesh>
      {occupied && <Silhouette size={size} seed={seed} glass={glassMat} glowMax={2.2} />}
      {lintel && (
        <mesh position={[0, h / 2 + 0.22, 0.04]}>
          <boxGeometry args={[w + 0.4, 0.26, 0.1]} />
          <meshStandardMaterial color={lintel} roughness={0.9} />
        </mesh>
      )}
    </group>
  )
}

// A room's window: glows and lights the ground in front when the room is on.
export function RoomWindow({ room, onToggle }) {
  const glass = useRef()
  const light = useRef()
  const [hovered, setHovered] = useState(false)
  const glow = useContext(WindowGlow)
  const [w, h] = room.size

  // Light sits just outside the window so it spills onto the ground.
  const lightPos = useMemo(() => {
    const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(UP, room.rotationY)
    return new THREE.Vector3(...room.position).addScaledVector(normal, 1.2).toArray()
  }, [room.position, room.rotationY])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 8)
    const target = room.on ? 4 * glow : hovered ? 0.6 : 0
    glass.current.emissiveIntensity = THREE.MathUtils.lerp(glass.current.emissiveIntensity, target, k)
    light.current.intensity = THREE.MathUtils.lerp(light.current.intensity, room.on ? 10 * glow : 0, k)
  })

  return (
    <group>
      <group position={room.position} rotation={[0, room.rotationY, 0]}>
        {room.trim && <WindowTrim w={w} h={h} />}
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[w + 0.16, h + 0.16]} />
          <meshStandardMaterial color={room.frame ?? '#2a2f36'} />
        </mesh>
        <mesh
          onClick={(e) => { e.stopPropagation(); onToggle(room.id) }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = '' }}
        >
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial
            ref={glass}
            color="#1c2733"
            emissive={WARM}
            emissiveIntensity={0}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>
      <pointLight ref={light} position={lightPos} color={WARM} intensity={0} distance={6} decay={2} />
    </group>
  )
}

// Neighbouring building drawn as a translucent volume so it never hides 6538.
export function Ghost({ size, position }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#c7cdd6" transparent opacity={0.16} depthWrite={false} />
      <Edges color="#8fa2ba" />
    </mesh>
  )
}
