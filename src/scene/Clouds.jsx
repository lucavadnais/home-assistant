import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Low-poly puffy clouds drifting along an arc *behind* the plot as seen from the camera,
// so they never cover the model. Centre of the plot: x 1.5, z -1.25.
const CENTER = new THREE.Vector2(1.5, -1.25)
const ARC = 1.4 // half-width of the arc, in radians either side of "straight behind"
const FADE = 0.35 // clouds shrink in / out over this angle at both ends of the arc
const DRIFT = 0.03 // rad / s

// Cloud n of `count`: evenly spread along the arc, with varied distance / height / size.
function layout(i, count) {
  const offset = -ARC + ((i + 0.5) * 2 * ARC) / count
  return { offset, distance: 17 + ((i * 7) % 4), height: 9.5 + ((i * 5) % 3) * 1.1, size: 0.85 + ((i * 3) % 4) * 0.12 }
}

// Puffs of one cloud, spread along local x: [x, y, z, radius]
const PUFFS = [[0, 0, 0, 1.6], [1.6, -0.3, 0.2, 1.2], [-1.6, -0.35, -0.1, 1.15], [0.6, 0.8, -0.2, 1.1], [-0.7, 0.6, 0.4, 0.95]]

function Cloud({ offset, distance, height, size, color, glow, speed }) {
  const ref = useRef()
  const travel = useRef(0)

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    // Integrate the drift so a speed change doesn't make the clouds jump.
    travel.current += dt * DRIFT * speed
    const camAz = Math.atan2(camera.position.x - CENTER.x, camera.position.z - CENTER.y)
    const o = THREE.MathUtils.euclideanModulo(offset + ARC + travel.current, ARC * 2) - ARC
    const a = camAz + Math.PI + o
    ref.current.position.set(
      CENTER.x + Math.sin(a) * distance,
      height + Math.sin(t * 0.4 + offset * 5) * 0.3,
      CENTER.y + Math.cos(a) * distance,
    )
    // Face the camera so the cloud's long side runs across the screen.
    ref.current.rotation.y = camAz
    ref.current.scale.setScalar(size * Math.min(1, (ARC - Math.abs(o)) / FADE))
  })

  return (
    <group ref={ref}>
      {PUFFS.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

export default function Clouds({ count, color, glow = 0.3, speed = 1 }) {
  return Array.from({ length: count }, (_, i) => (
    <Cloud key={`${count}-${i}`} {...layout(i, count)} color={color} glow={glow} speed={speed} />
  ))
}
