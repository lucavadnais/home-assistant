import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { dotTexture } from './textures'

// Falling rain or snow over the plot, and wind-blown streaks and leaves. Re-mounted when the weather changes.
const BOUNDS = { x: [-14, 13], y: [0, 14], z: [-18.5, 21.5] }
const span = (r) => r[0] + Math.random() * (r[1] - r[0])

// wind: sideways drift (units/s) downwind; flakes wrap around the plot horizontally.
function Snow({ count = 1400, speed = 1.4, wind = 0, size = 3 }) {
  const points = useRef()
  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions.set([span(BOUNDS.x), span(BOUNDS.y), span(BOUNDS.z)], i * 3)
      phases[i] = Math.random() * Math.PI * 2
    }
    return { positions, phases }
  }, [count])

  useFrame(({ clock }, dt) => {
    const attr = points.current.geometry.attributes.position
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) - speed * dt * (0.7 + 0.3 * Math.sin(phases[i]))
      if (y < 0) y = BOUNDS.y[1]
      attr.setY(i, y)
      let x = attr.getX(i) + (wind * (0.8 + 0.4 * Math.sin(phases[i])) + Math.sin(t + phases[i]) * 0.5) * dt
      if (x > BOUNDS.x[1]) x = BOUNDS.x[0]
      attr.setX(i, x)
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={dotTexture()} size={size} color="#ffffff" transparent alphaTest={0.3} depthWrite={false} />
    </points>
  )
}

// Rain as short streaks, slanted and carried downwind (+x) by the 0..1 wind strength.
function Rain({ count, speed, color, wind }) {
  const lines = useRef()
  const length = 0.55

  const positions = useMemo(() => {
    const p = new Float32Array(count * 6)
    for (let i = 0; i < count; i++) {
      const x = span(BOUNDS.x)
      const y = span(BOUNDS.y)
      const z = span(BOUNDS.z)
      p.set([x, y, z, x, y - length, z], i * 6)
    }
    return p
  }, [count])

  useFrame((_, dt) => {
    const attr = lines.current.geometry.attributes.position
    const a = attr.array
    const slant = 0.08 + wind * 0.9
    const drop = speed * dt
    for (let i = 0; i < count; i++) {
      const k = i * 6
      let y = a[k + 1] - drop
      let x = a[k] + drop * (slant / length)
      if (y < 0) {
        y = BOUNDS.y[1]
        x = span(BOUNDS.x)
      }
      if (x > BOUNDS.x[1]) x = BOUNDS.x[0]
      a[k] = x
      a[k + 1] = y
      a[k + 3] = x + slant
      a[k + 4] = y - length
    }
    attr.needsUpdate = true
  })

  return (
    <lineSegments ref={lines}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.55} depthWrite={false} />
    </lineSegments>
  )
}

const ramp = (v, from, to) => Math.min(1, Math.max(0, (v - from) / (to - from)))

// Wind gusts: faint horizontal streaks racing downwind; more, faster and brighter as wind rises.
export function Gusts({ strength, count = 160 }) {
  const lines = useRef()
  const length = 1.8

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 6)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = span(BOUNDS.x)
      const y = 0.5 + Math.random() * 9
      const z = span(BOUNDS.z)
      positions.set([x, y, z, x - length, y, z], i * 6)
      speeds[i] = 0.6 + Math.random() * 0.8
    }
    return { positions, speeds }
  }, [count])

  const visible = Math.round(count * ramp(strength, 0.2, 1))

  useFrame((_, dt) => {
    const attr = lines.current.geometry.attributes.position
    const a = attr.array
    const speed = 8 + 30 * strength
    for (let i = 0; i < visible; i++) {
      const k = i * 6
      let x = a[k] + speeds[i] * speed * dt
      if (x - length > BOUNDS.x[1]) {
        x = BOUNDS.x[0]
        a[k + 1] = a[k + 4] = 0.5 + Math.random() * 9
        a[k + 2] = a[k + 5] = span(BOUNDS.z)
      }
      a[k] = x
      a[k + 3] = x - length
    }
    attr.needsUpdate = true
  })

  return (
    <lineSegments ref={lines} visible={visible > 0}>
      <bufferGeometry drawRange={{ start: 0, count: visible * 2 }}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.15 + 0.3 * strength} depthWrite={false} />
    </lineSegments>
  )
}

// Autumn leaves torn off and tumbling downwind; how many depends on the wind.
export function BlowingLeaves({ colors, strength, count = 90 }) {
  const mesh = useRef()
  const leaves = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: span(BOUNDS.x),
        z: span(BOUNDS.z),
        base: 0.3 + Math.random() * 4,
        phase: Math.random() * Math.PI * 2,
        spin: 2 + Math.random() * 6,
        pace: 0.6 + Math.random() * 0.8,
      })),
    [count],
  )
  const visible = Math.round(count * ramp(strength, 0.15, 0.8))

  const dummy = useMemo(() => new THREE.Object3D(), [])
  useLayoutEffect(() => {
    const c = new THREE.Color()
    leaves.forEach((_, i) => mesh.current.setColorAt(i, c.set(colors[i % colors.length])))
    mesh.current.instanceColor.needsUpdate = true
  }, [leaves, colors])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const speed = 3 + 14 * strength
    for (let i = 0; i < visible; i++) {
      const l = leaves[i]
      l.x += l.pace * speed * dt
      if (l.x > BOUNDS.x[1]) {
        l.x = BOUNDS.x[0]
        l.z = span(BOUNDS.z)
      }
      dummy.position.set(l.x, l.base + Math.sin(t * 1.3 + l.phase) * 0.6 * strength, l.z + Math.sin(t * 0.9 + l.phase) * 0.4)
      dummy.rotation.set(t * l.spin + l.phase, t * l.spin * 0.7, l.phase)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.count = visible
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.16, 0.1]} />
      <meshStandardMaterial roughness={1} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

// `wind` is the 0..1 strength: it slants the rain and drifts the snow downwind.
export default function Precipitation({ type, wind = 0 }) {
  if (type === 'snow') return <Snow wind={wind * 14} />
  if (type === 'snowstorm') return <Snow count={4000} speed={3.5} wind={wind * 14} size={2.4} />
  if (type === 'rain') return <Rain count={900} speed={16} color="#b9cde0" wind={wind} />
  if (type === 'storm') return <Rain count={1500} speed={22} color="#c6d4e2" wind={wind} />
  return null
}
