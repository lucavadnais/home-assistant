import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SNOW, STREET_TREE } from './seasons'

// Deterministic pseudo-random sequence so plants look the same on every load.
function seeded(seed) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647
}

const TREE_CLUSTERS = [
  [0, 4.6, 0, 0.95], [1.1, 4.0, 0.3, 0.8], [-1.0, 4.1, -0.2, 0.85], [0.3, 3.9, 1.1, 0.75],
  [-0.4, 3.8, -1.1, 0.8], [0.8, 3.3, -0.7, 0.65], [-0.9, 3.3, 0.8, 0.7], [0.2, 5.3, -0.3, 0.6],
  [1.2, 3.2, 0.9, 0.55], [-1.3, 3.5, -0.9, 0.55],
]
const BRANCHES = [[0.5, 0.3], [-0.5, -0.2], [0.2, -0.55], [-0.25, 0.5]]

// Pivots its children around the group origin (the base) so they bend downwind (+x) and flutter.
// `wind` is the 0..1 strength; it is eased so changes don't snap. `stiffness` scales the motion
// (a conifer bends less than a parasol). Lean grows with the square of the wind, like drag.
export function Sway({ wind = 0, stiffness = 1, phase = 0, children, ...props }) {
  const ref = useRef()
  const strength = useRef(0)

  useFrame(({ clock }, dt) => {
    strength.current = THREE.MathUtils.lerp(strength.current, wind, 1 - Math.exp(-dt * 1.5))
    const w = strength.current
    const t = clock.elapsedTime + phase
    const gust = 0.65 + 0.35 * Math.sin(t * (0.4 + 0.5 * w)) * Math.sin(t * 0.23 + 1)
    const flutter = Math.sin(t * (1.6 + 3.5 * w))
    ref.current.rotation.z = -stiffness * (w * w * 0.16 * gust + w * 0.025 * flutter)
    ref.current.rotation.x = stiffness * w * 0.015 * Math.sin(t * (1.3 + 2 * w))
  })

  return <group ref={ref} {...props}>{children}</group>
}

// Deciduous street tree in front of the duplex. `foliage` = { colors, density } or null (bare).
export function StreetTree({ foliage, snow, wind }) {
  return (
    <group position={[STREET_TREE[0], 0, STREET_TREE[1]]}>
      <Sway wind={wind}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.17, 2.8, 7]} />
          <meshStandardMaterial color="#4e3a2c" roughness={1} />
        </mesh>
        {BRANCHES.map(([tx, tz], i) => (
          <mesh key={i} position={[tx * 1.1, 3.4, tz * 1.1]} rotation={[tz * 1.2, 0, -tx * 1.2]} castShadow>
            <cylinderGeometry args={[0.03, 0.07, 1.8, 5]} />
            <meshStandardMaterial color={snow ? '#6b5a4c' : '#4e3a2c'} roughness={1} />
          </mesh>
        ))}
        {foliage &&
          TREE_CLUSTERS.map(([x, y, z, r], i) =>
            // Golden-ratio spread keeps the remaining clusters evenly thinned out.
            (i * 0.618) % 1 < foliage.density ? (
              <mesh key={i} position={[x, y, z]} castShadow>
                <icosahedronGeometry args={[r, 0]} />
                <meshStandardMaterial color={foliage.colors[i % foliage.colors.length]} flatShading roughness={1} />
              </mesh>
            ) : null,
          )}
      </Sway>
      {snow && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.6, 12]} />
          <meshStandardMaterial color={SNOW} />
        </mesh>
      )}
    </group>
  )
}

// Leaves lying on the ground: dense under the street tree, sparse across the lot.
export function FallenLeaves({ colors, count = 520 }) {
  const mesh = useRef()

  const items = useMemo(() => {
    const rand = seeded(11)
    return Array.from({ length: count }, (_, i) => {
      let x, z
      if (i < count * 0.6) {
        const a = rand() * Math.PI * 2
        const d = Math.sqrt(rand()) * 3.4
        x = STREET_TREE[0] + Math.cos(a) * d
        z = STREET_TREE[1] + Math.sin(a) * d
      } else {
        x = -13.5 + rand() * 26
        z = -15.5 + rand() * 28
      }
      return { x, z, rot: rand() * Math.PI, scale: 0.7 + rand() * 0.6, color: colors[i % colors.length] }
    })
  }, [colors, count])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const c = new THREE.Color()
    items.forEach((it, i) => {
      q.setFromEuler(e.set(-Math.PI / 2, 0, it.rot))
      m.compose(new THREE.Vector3(it.x, 0.045, it.z), q, new THREE.Vector3(it.scale, it.scale, 1))
      mesh.current.setMatrixAt(i, m)
      mesh.current.setColorAt(i, c.set(it.color))
    })
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.instanceColor.needsUpdate = true
  }, [items])

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} receiveShadow>
      <planeGeometry args={[0.16, 0.1]} />
      <meshStandardMaterial roughness={1} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

const BUSH_MOUNDS = [[0, 0.55, 0, 0.75], [0.6, 0.45, 0.2, 0.6], [-0.55, 0.45, -0.1, 0.6], [0.1, 0.9, -0.2, 0.55]]

// Hydrangea next to the 6538 gate. `leaves` / `blooms` are colours, null when absent.
export function Hydrangea({ position, leaves, blooms, snow, wind }) {
  const heads = useMemo(() => {
    const rand = seeded(5)
    return Array.from({ length: 16 }, () => {
      const a = rand() * Math.PI * 2
      const up = 0.3 + rand() * 0.7
      return [Math.cos(a) * 0.75 * (1.1 - up * 0.5), 0.45 + up * 0.75, Math.sin(a) * 0.55, 0.13 + rand() * 0.07]
    })
  }, [])

  return (
    <Sway wind={wind} stiffness={0.35} phase={2.1} position={position}>
      {leaves &&
        BUSH_MOUNDS.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[1, 0.85, 0.8]} castShadow>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color={leaves} flatShading roughness={1} />
          </mesh>
        ))}
        
      {blooms &&
        heads.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, leaves ? y : y * 0.8, z]} castShadow>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color={snow && i % 3 === 0 ? SNOW : blooms} flatShading roughness={1} />
          </mesh>
        ))}
    </Sway>
  )
}
