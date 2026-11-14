import { createContext, useContext, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Edges } from '@react-three/drei'
import { SILHOUETTES, barsTexture, silhouetteTexture, worldUvBox } from './textures'
import { between, hash, random } from './chance'

const WARM = new THREE.Color('#ffb85c')
const UP = new THREE.Vector3(0, 1, 0)

// Scales lit windows: 1 at night, lower in daylight where interior lights barely show.
export const WindowGlow = createContext(1)

// Who may walk past the lit windows of a building (SILHOUETTES ids). Wrap a building in a
// provider to give it its own household; the default is the brick duplex's.
export const WindowPeople = createContext([
  SILHOUETTES.plain, SILHOUETTES.ponytail, SILHOUETTES.bun, SILHOUETTES.man,
])

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
  const people = useContext(WindowPeople)
  // One texture per person of the household, cloned so each window can slide its own copy
  const textures = useMemo(() => people.map((p) => silhouetteTexture(p).clone()), [people])
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
    const texture = textures[Math.floor(c(1) * textures.length)]
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

// Keeps the part of polygon `pts` where side * (x - edge) >= 0 (one Sutherland–Hodgman pass).
function clipX(pts, edge, side) {
  const inside = ([px]) => side * (px - edge) >= 0
  const out = []
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length]
    if (inside(p)) out.push(p)
    if (inside(p) !== inside(q)) {
      const t = (edge - p[0]) / (q[0] - p[0])
      out.push([edge, p[1] + t * (q[1] - p[1])])
    }
  })
  return out
}

const TREE_COLORS =['#ff3b3b', '#ffd23b', '#3bff7a', '#3bb8ff', '#ff5cf0', '#fff4d6']

// A Christmas tree seen through the glass: dark silhouette dotted with twinkling bulbs.
function ChristmasTree({ w, h }) {
  const bulbs = useRef([])
  const glow = useContext(WindowGlow)
  const height = Math.min(h * 0.82, w * 1.4)
  const base = -h / 2 + 0.07
  const x = -w * 0.2
  const spread = 0.42
  // Glass edges in the tree's own coordinates; whatever sticks out is cut off.
  const left = -w / 2 - x
  const right = w / 2 - x

  // Three stacked tiers read as a fir rather than a plain triangle.
  const shape = useMemo(() => {
    const half = height * spread
    const tiers = [[0.33, 0.78], [0.62, 0.55]]
    const pts = [[-half, 0], [half, 0]]
    tiers.forEach(([y, k]) => pts.push([half * k * 0.6, y * height], [half * k, y * height]))
    pts.push([0, height])
    tiers.slice().reverse().forEach(([y, k]) => pts.push([-half * k, y * height], [-half * k * 0.6, y * height]))
    const clipped = clipX(clipX(pts, left, 1), right, -1)
    return new THREE.Shape(clipped.map(([px, py]) => new THREE.Vector2(px, py)))
  }, [height, left, right])

  // Bulbs scattered inside the triangle, each with its own blink speed and phase.
  const spots = useMemo(() => {
    const out = []
    const half = height * spread
    // Half-width of the tiered outline at height fraction t
    const halfAt = (t) =>
      t < 0.33 ? half * (1 - (t / 0.33) * (1 - 0.78 * 0.6))
      : t < 0.62 ? half * 0.78 * (1 - ((t - 0.33) / 0.29) * (1 - (0.55 * 0.6) / 0.78))
      : half * 0.55 * (1 - (t - 0.62) / 0.38)
    // Random spots kept at least `gap` apart: even coverage without a visible pattern
    const gap = 0.085
    for (let i = 0; i < 600; i++) {
      const y = 0.04 + random(i * 2 + 101) * height * 0.88
      const span = halfAt(y / height) - 0.03
      const bx = (random(i * 2 + 102) * 2 - 1) * span
      if (span <= 0 || bx < left + 0.025 || bx > right - 0.025) continue
      if (out.some(({ pos: [ox, oy] }) => Math.hypot(bx - ox, y - oy) < gap)) continue
      out.push({ pos: [bx, y] })
    }
    out.forEach((s, i) => {
      Object.assign(s, {
        color: TREE_COLORS[Math.floor(random(i * 11 + 7) * TREE_COLORS.length)],
        speed: 1.5 + random(i * 3 + 3) * 3,
        phase: random(i * 7 + 5) * Math.PI * 2,
      })
    })
    return out
  }, [height, left, right])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const level = Math.max(glow, 0.5)
    bulbs.current.forEach((m, i) => {
      const s = spots[i]
      const blink = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase)
      m.material.opacity = (0.25 + 0.75 * blink * blink) * level
    })
  })

  return (
    <group position={[x, base, 0.003]}>
      <mesh>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color="#0b3d1c" toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.035, 0]}>
        <planeGeometry args={[0.08, 0.07]} />
        <meshBasicMaterial color="#3a2414" toneMapped={false} />
      </mesh>
      {spots.map((s, i) => (
        <mesh key={i} ref={(m) => { bulbs.current[i] = m }} position={[s.pos[0], s.pos[1], 0.001]}>
          <circleGeometry args={[0.022, 10]} />
          <meshBasicMaterial color={s.color} transparent toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, height, 0.001]}>
        <circleGeometry args={[0.04, 5]} />
        <meshBasicMaterial color="#ffe27a" toneMapped={false} />
      </mesh>
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
    // Dimmer glass behind a tree so its silhouette isn't washed out by the glow.
    const target = room.on ? (room.tree ? 1.6 : 4) * glow : hovered ? 0.6 : 0
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
        {room.tree && <ChristmasTree w={w} h={h} />}
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
