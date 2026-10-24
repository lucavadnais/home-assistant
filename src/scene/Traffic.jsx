import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { between, hash, hourOf, random } from './chance'
import { SNOW } from './seasons'

// Street life: a few cars driving along the one-way street (+x) and two parking spots in
// front of the houses that are taken or free depending on the time.
// Street: parking lane z ≈ 16, driving lane z ≈ 19. Cars fade in over the first FADE metres
// of the plot (x edges -14 / 13) and fade out over the last ones, so they never hang past it.

const PARKING_Z = 15.8
const DRIVE_Z = 18.9
const PLOT_X = [-14, 13]
const FADE = 5
const ENTER_X = PLOT_X[0]
const EXIT_X = PLOT_X[1]

// 0 at the plot's edges, 1 from FADE metres inside them.
const visibility = (x) => THREE.MathUtils.clamp(Math.min(x - PLOT_X[0], PLOT_X[1] - x) / FADE, 0, 1)

const COLORS = ['#c9ccd1', '#1f2329', '#8b1e24', '#2a4a7a', '#e8e6e1', '#5d6168', '#3d5a3e', '#b5892e']
const GLASS = '#25303b'

// Low-poly sedan, 4.2 m long, nose toward +x. `lights` turns head/tail lights on;
// `fading` makes its materials transparent so a driving car can fade in and out.
function Car({ color, lights = false, snow = false, fading = false, shadows = true, ...props }) {
  const mat = { transparent: fading }
  return (
    <group {...props}>
      <mesh position={[0, 0.6, 0]} castShadow={shadows}>
        <boxGeometry args={[4.2, 0.65, 1.8]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} {...mat} />
      </mesh>
      <mesh position={[-0.25, 1.17, 0]} castShadow={shadows}>
        <boxGeometry args={[2.2, 0.5, 1.6]} />
        <meshStandardMaterial color={GLASS} roughness={0.2} metalness={0.4} {...mat} />
      </mesh>
      <mesh position={[-0.25, 1.44, 0]}>
        <boxGeometry args={[2.0, 0.05, 1.62]} />
        <meshStandardMaterial color={snow ? SNOW : color} roughness={0.4} metalness={0.3} {...mat} />
      </mesh>
      {[[1.35, 0.85], [1.35, -0.85], [-1.35, 0.85], [-1.35, -0.85]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.33, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 12]} />
          <meshStandardMaterial color="#141518" roughness={0.9} {...mat} />
        </mesh>
      ))}
      {[0.6, -0.6].map((z) => (
        <group key={z}>
          <mesh position={[2.11, 0.68, z]}>
            <boxGeometry args={[0.04, 0.16, 0.36]} />
            <meshStandardMaterial color="#f4f1e6" emissive="#fff4d6" emissiveIntensity={lights ? 3 : 0} toneMapped={!lights} {...mat} />
          </mesh>
          <mesh position={[-2.11, 0.7, z]}>
            <boxGeometry args={[0.04, 0.14, 0.32]} />
            <meshStandardMaterial color="#7a1414" emissive="#ff2a1a" emissiveIntensity={lights ? 2 : 0} toneMapped={!lights} {...mat} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Seconds to wait before the next car, scaled by the hour: a quiet residential street, a bit
// busier at rush hour, rare in the evening and nearly empty at night.
function nextGap(hour) {
  const base = between(Math.random(), 20, 50)
  if (hour >= 0.5 && hour < 5.5) return base * 20 // ~one car every 10–15 min
  if (hour >= 22 || hour < 0.5) return base * 6
  if (hour >= 19) return base * 2.5
  if ((hour >= 7 && hour < 9) || (hour >= 16 && hour < 18.5)) return base * 0.6
  return base
}

// Cars driving through. Each of the `count` drivers waits, fades in at the west edge of the plot,
// drives east and fades out at the east edge; a car slows to the speed of the one ahead instead of running into it.
function Through({ count = 2, lights, shadows }) {
  const groups = useRef([])
  const cars = useRef(
    Array.from({ length: count }, (_, i) => ({ x: null, speed: 0, wait: between(Math.random(), 3, 20) + i * 15, color: COLORS[i] })),
  )
  const [colors, setColors] = useState(() => cars.current.map((c) => c.color))

  useFrame((_, dt) => {
    const step = Math.min(dt, 0.1)
    let recolor = false
    cars.current.forEach((car, i) => {
      if (car.x === null) {
        car.wait -= step
        const entryFree = cars.current.every((o) => o.x === null || o.x - ENTER_X > 7)
        if (car.wait <= 0 && entryFree) {
          car.x = ENTER_X
          car.speed = between(Math.random(), 7, 11)
          car.color = COLORS[Math.floor(Math.random() * COLORS.length)]
          recolor = true
        }
      } else {
        const ahead = cars.current
          .filter((o) => o !== car && o.x !== null && o.x > car.x)
          .reduce((a, o) => (a === null || o.x < a.x ? o : a), null)
        const speed = ahead && ahead.x - car.x < 8 ? Math.min(car.speed, ahead.speed) : car.speed
        car.x += speed * step
        if (car.x >= EXIT_X) {
          car.x = null
          car.wait = nextGap(hourOf(new Date()))
        }
      }
      const g = groups.current[i]
      g.visible = car.x !== null
      if (car.x === null) return
      g.position.x = car.x
      const opacity = visibility(car.x)
      g.traverse((o) => { if (o.material) o.material.opacity = opacity })
    })
    if (recolor) setColors(cars.current.map((c) => c.color))
  })

  return colors.map((color, i) => (
    <group key={i} ref={(g) => (groups.current[i] = g)} position={[ENTER_X, 0, DRIVE_Z]} visible={false}>
      <Car color={color} lights={lights} shadows={shadows} fading />
    </group>
  ))
}

// Parking spots in front of the duplex and the right-hand neighbour; a spot with a `color` always
// gets the same car, the others a random one each time. Each spot is taken or free
// for stretches of 40 min – 3 h; overnight they are more often taken (residents are home).
const SPOTS = [
  { id: 'place-duplex', x: -5.5, color: '#a3161c' }, // the duplex's red car
  { id: 'place-droite', x: 8.2 },
]

function occupant(spot, date) {
  const seed = hash(spot.id)
  const slot = between(random(seed), 40, 180)
  const minutes = date.getTime() / 60000 + random(seed + 1) * slot
  const n = Math.floor(minutes / slot)
  const hour = hourOf(date)
  const p = hour >= 19 || hour < 7 ? 0.75 : 0.45
  if (random(seed + n * 7) >= p) return null
  return spot.color ?? COLORS[Math.floor(random(seed + n * 13) * COLORS.length)]
}

function Parked({ snow }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return SPOTS.map((spot) => {
    const color = occupant(spot, now)
    return color && <Car key={spot.id} color={color} snow={snow} position={[spot.x, 0, PARKING_Z]} />
  })
}

// `movingShadows` off: driving cars cast no shadow (the shadow map isn't redrawn every frame).
export default function Traffic({ night, snow, movingShadows = true }) {
  return (
    <group>
      <Through lights={night} shadows={movingShadows} />
      <Parked snow={snow} />
    </group>
  )
}
