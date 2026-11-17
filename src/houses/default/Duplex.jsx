import * as THREE from 'three'
import { Ghost, Solid, Wall, Railing, StaticWindow } from '../../scene/parts'
import { brickTexture, slatTexture } from '../../scene/textures'
import { SNOW } from '../../scene/seasons'

// Street-front brick duplex. Main block x -9..0, z -4..8 (facade at z = 8),
// rear extension z -10..-4. Porch with two stacked balconies along the facade.
const FACADE = 8
const BACK = -10
const STONE = '#d8d2c6'
const TRIM = '#3c4148'
const DECK = '#3b3e44'
const IRON = '#1b1d21'

const OPENINGS = [
  { x: -7.5, size: [1.3, 2.0], frame: '#2a2f36' },
  { x: -4.9, size: [0.85, 2.2], frame: '#2f4a3c', glass: '#2a3f33' },
  { x: -3.7, size: [0.85, 2.2], frame: '#2f4a3c', glass: '#2a3f33' },
  { x: -1.6, size: [1.3, 2.0], frame: '#2a2f36' },
]

// Units for the neighbour-lights simulation: one household per floor.
const UNIT = { ground: 'duplex-rdc', upper: 'duplex-etage' }

function Facade({ lit }) {
  return (
    <group>
      {[[1.0, UNIT.ground], [4.25, UNIT.upper]].map(([floor, unit]) =>
        OPENINGS.map((o) => (
          <StaticWindow
            key={`${floor}${o.x}`}
            position={[o.x, floor + 0.3 + o.size[1] / 2, FACADE + 0.01]}
            size={o.size}
            frame={o.frame}
            glass={o.glass}
            lintel="#c9b99b"
            lit={lit(`${unit}:front${o.x}`)}
          />
        )),
      )}

      {/* Cornice with the three decorative arches */}
      <Solid size={[9.4, 0.35, 0.5]} position={[-4.5, 7.75, FACADE + 0.1]} color={STONE} />
      {[-7.2, -4.5, -1.8].map((x) => (
        <group key={x} position={[x, 7.92, FACADE + 0.15]}>
          <mesh castShadow>
            <torusGeometry args={[0.7, 0.13, 8, 20, Math.PI]} />
            <meshStandardMaterial color={STONE} />
          </mesh>
          <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.1, 16]} />
            <meshStandardMaterial color={STONE} />
          </mesh>
        </group>
      ))}

      {/* Stone quoins on the corner facing the passage */}
      {Array.from({ length: 14 }, (_, i) => {
        const w = i % 2 ? 0.3 : 0.45
        const y = 0.4 + i * 0.52
        return (
          <group key={i}>
            <Solid size={[0.06, 0.26, w]} position={[0.03, y, FACADE - w / 2]} color={STONE} cast={false} />
            <Solid size={[w, 0.26, 0.06]} position={[-w / 2, y, FACADE + 0.03]} color={STONE} cast={false} />
          </group>
        )
      })}
    </group>
  )
}

// Side walls (passage at x = 0, west neighbour at x = -9), identical: two pairs of narrow sash
// windows stacked on both floors with stone sills, grey concrete base with a basement window.
// `dir` is the wall's outward direction along x.
const SIDE_WINDOWS = [3.8, 0.4]

function SideWall({ x, dir, lit }) {
  const name = dir > 0 ? 'est' : 'ouest'
  return (
    <group>
      {SIDE_WINDOWS.map((z) =>
        [[1.0, UNIT.ground], [4.25, UNIT.upper]].map(([floor, unit]) => (
          <group key={`${z}${floor}`}>
            <StaticWindow position={[x + dir * 0.01, floor + 1.3, z]} rotationY={(dir * Math.PI) / 2} size={[0.6, 1.6]} lit={lit(`${unit}:${name}${z}`)} />
            <Solid size={[0.12, 0.1, 0.85]} position={[x + dir * 0.06, floor + 0.43, z]} color={STONE} cast={false} />
          </group>
        )),
      )}
      <Solid size={[0.06, 0.9, 11.5]} position={[x + dir * 0.03, 0.45, 1.75]} color="#a9a8a3" cast={false} />
      <StaticWindow position={[x + dir * 0.07, 0.45, 4.6]} rotationY={(dir * Math.PI) / 2} size={[0.45, 0.4]} frame="#8a8984" />
    </group>
  )
}

// Cable running along the brick on the passage side.
function Cable() {
  return (
    <mesh position={[0.05, 3.9, 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.015, 0.015, 12, 4]} />
      <meshStandardMaterial color="#3a3d42" />
    </mesh>
  )
}

// The porch and the balcony above it, with its roof, stop just past the right-hand window
// (x = UPPER_END) instead of reaching the passage corner.
const UPPER_END = -0.8

function Porch() {
  const front = FACADE + 2.2
  const upperWidth = UPPER_END + 9
  return (
    <group>
      <Solid size={[upperWidth, 1.0, 2.2]} position={[-9 + upperWidth / 2, 0.5, FACADE + 1.1]} color={DECK} />
      <Solid size={[upperWidth, 0.25, 2.2]} position={[-9 + upperWidth / 2, 4.0, FACADE + 1.1]} color={TRIM} />
      <Solid size={[upperWidth + 0.2, 0.3, 2.3]} position={[-9 + upperWidth / 2, 7.15, FACADE + 1.15]} color={TRIM} />
      {[-8.85, -6, -3, UPPER_END - 0.13].map((x) => (
        <Solid key={x} size={[0.25, 6.0, 0.25]} position={[x, 4.1, front - 0.15]} color={TRIM} />
      ))}

      <Railing length={2.8} height={0.9} position={[-7.6, 1.0, front - 0.05]} />
      <Railing length={UPPER_END + 3.8} height={0.9} position={[(UPPER_END - 3.8) / 2, 1.0, front - 0.05]} />
      <Railing length={2.2} height={0.9} position={[UPPER_END - 0.03, 1.0, FACADE + 1.1]} rotationY={Math.PI / 2} />
      <Railing length={upperWidth} height={0.95} position={[-9 + upperWidth / 2, 4.12, front - 0.05]} />
      {/* Side railing at the balcony's end, open where the stair lands (z STAIR_LANDING_Z ± 0.4) */}
      <Railing length={STAIR_LANDING_Z - 0.4 - FACADE} height={0.95} position={[UPPER_END - 0.03, 4.12, (FACADE + STAIR_LANDING_Z - 0.4) / 2]} rotationY={Math.PI / 2} />
      <Railing length={front - STAIR_LANDING_Z - 0.4} height={0.95} position={[UPPER_END - 0.03, 4.12, (front + STAIR_LANDING_Z + 0.4) / 2]} rotationY={Math.PI / 2} />

      {/* Front steps to the ground-floor porch */}
      {[1, 2, 3].map((i) => {
        const top = 1.0 - 0.25 * i
        return <Solid key={i} size={[2.4, top, 0.35]} position={[-5.25, top / 2, front + 0.35 * (i - 0.5)]} color={DECK} />
      })}
    </group>
  )
}

// Black steel stair to the upper balcony, Montreal style: a straight flight rising toward the
// passage along the front of the porch, then a tight half turn by the corner that lands on the
// balcony's end from the side.
const STAIR_TOP = 4.125
const STAIR_WIDTH = 0.8
const STAIR_TURN = { x: UPPER_END, z: FACADE + 2.0, radius: 0.65 } // centre of the half turn
const STAIR_LANDING_Z = STAIR_TURN.z - STAIR_TURN.radius

// One stair tread per entry: centre x/z, top height y, heading angle (0 = toward +z).
function stairTreads() {
  const steps = 20
  const rise = STAIR_TOP / steps
  const straight = 13
  const run = 0.24
  const { x: cx, z: cz, radius } = STAIR_TURN
  const treads = []
  for (let i = 0; i < straight; i++) {
    treads.push({ x: cx - (straight - i - 0.5) * run, z: cz + radius, y: rise * (i + 1), heading: Math.PI / 2, depth: run })
  }
  const turn = steps - straight
  for (let j = 0; j < turn; j++) {
    const a = ((j + 0.5) / turn) * Math.PI
    treads.push({
      x: cx + radius * Math.sin(a),
      z: cz + radius * Math.cos(a),
      y: rise * (straight + j + 1),
      heading: Math.PI / 2 + a,
      depth: 0.3,
    })
  }
  return treads
}

// Thin bar between two points (handrails).
function Bar({ from, to, size = 0.04, color }) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = b.clone().sub(a)
  const length = dir.length()
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return (
    <mesh position={a.add(b).multiplyScalar(0.5)} quaternion={quaternion}>
      <boxGeometry args={[size, length, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function FrontStair() {
  const treads = stairTreads()
  // Posts at both ends of every other tread, joined by a handrail on each side.
  const sides = [-1, 1].map((side) =>
    treads
      .filter((_, i) => i % 2 === 1 || i === treads.length - 1)
      .map((t) => {
        const nx = Math.cos(t.heading) * side
        const nz = -Math.sin(t.heading) * side
        return [t.x + nx * (STAIR_WIDTH / 2), t.y, t.z + nz * (STAIR_WIDTH / 2)]
      }),
  )
  return (
    <group>
      {treads.map((t, i) => (
        <Solid key={i} size={[STAIR_WIDTH, 0.05, t.depth]} position={[t.x, t.y - 0.025, t.z]} rotation={[0, t.heading, 0]} color={IRON} />
      ))}
      {sides.map((posts, s) => (
        <group key={s}>
          {posts.map(([x, y, z], i) => (
            <Solid key={i} size={[0.03, 0.9, 0.03]} position={[x, y + 0.45, z]} color={IRON} cast={false} />
          ))}
          {posts.slice(1).map((p, i) => (
            <Bar key={i} from={[posts[i][0], posts[i][1] + 0.9, posts[i][2]]} to={[p[0], p[1] + 0.9, p[2]]} color={IRON} />
          ))}
        </group>
      ))}
    </group>
  )
}

// Back of the duplex, as seen from the lane: wooden balcony over a covered patio, white roof
// overhang, black steel stair down along the 6538 wall, and mini-split units on the brick.
function Back({ roof, lit }) {
  const deck = '#b07a45'
  const edge = BACK - 2.2
  const level = 3.3
  const slats = slatTexture('#c08a55')
  return (
    <group>
      {[[-2.2, 0.15, UNIT.ground], [-6.4, 0.15, UNIT.ground], [-2.2, level, UNIT.upper], [-6.4, level, UNIT.upper]].map(([x, y, unit]) => (
        <StaticWindow key={`${x}${y}`} position={[x, y + 1.05, BACK - 0.01]} rotationY={Math.PI} size={[1.6, 2.1]} glass="#2b3540" lit={lit(`${unit}:back${x}`)} />
      ))}
      {[1.9, level + 1.9].map((y) => (
        <Solid key={y} size={[0.85, 0.55, 0.25]} position={[-4.3, y, BACK - 0.13]} color="#eceae5" />
      ))}

      {/* Ground patio and the balcony above it */}
      <Solid size={[9, 0.15, 2.2]} position={[-4.5, 0.08, BACK - 1.1]} color={deck} />
      <Solid size={[9, 0.22, 2.2]} position={[-4.5, level - 0.11, BACK - 1.1]} color={deck} />
      {[-8.85, -4.5, -0.15].map((x) => (
        <Solid key={x} size={[0.18, 6.6, 0.18]} position={[x, 3.3, edge + 0.09]} color={deck} />
      ))}
      <Wall size={[7.6, 1.0, 0.06]} position={[-5.05, level + 0.5, edge + 0.05]} texture={slats} />
      <Wall size={[0.06, 1.0, 2.1]} position={[-8.95, level + 0.5, BACK - 1.1]} texture={slats} />

      {/* Roof overhang: white fascia and soffit, roof membrane on top. It stops short of x = 0
          so it doesn't run over the parapet of 6538 next door. */}
      <Solid size={[9.0, 0.22, 2.5]} position={[-4.65, 6.7, BACK - 1.25]} color="#eeece7" />
      <Solid size={[9.0, 0.04, 2.5]} position={[-4.65, 6.83, BACK - 1.25]} color={roof} cast={false} />

      <BackStair top={level} edge={edge} />
    </group>
  )
}

// Straight steel stair from the balcony down toward the lane, against the 6538 side wall.
function BackStair({ top, edge }) {
  const steps = 13
  const rise = top / steps
  const run = 0.26
  const x = -0.7
  const length = steps * run
  const angle = Math.atan2(top, length)
  const slope = Math.hypot(top, length)
  const midZ = edge - length / 2
  const steel = '#1f2226'
  return (
    <group>
      {Array.from({ length: steps }, (_, i) => (
        <Solid key={i} size={[0.9, 0.04, run - 0.03]} position={[x, rise * (i + 1) - 0.02, edge - length + run * (i + 0.5)]} color={steel} />
      ))}
      {[-0.47, 0.47].map((dx) => (
        <group key={dx}>
          <Solid size={[0.04, 0.22, slope]} position={[x + dx, top / 2, midZ]} rotation={[-angle, 0, 0]} color={steel} />
          <Solid size={[0.04, 0.05, slope]} position={[x + dx, top / 2 + 0.95, midZ]} rotation={[-angle, 0, 0]} color={steel} />
          {Array.from({ length: 7 }, (_, i) => {
            const t = (i + 0.5) / 7
            return <Solid key={i} size={[0.025, 0.95, 0.025]} position={[x + dx, top * t + 0.47, edge - length * (1 - t)]} color={steel} cast={false} />
          })}
        </group>
      ))}
    </group>
  )
}

// Pipes and gas meters on the extension wall facing the courtyard (see the 6538 door photo).
function Utilities() {
  return (
    <group>
      {[-9.6, -9.35, -9.1].map((z) => (
        <mesh key={z} position={[0.06, 3.2, z]}>
          <cylinderGeometry args={[0.04, 0.04, 6.4, 6]} />
          <meshStandardMaterial color="#c9cbcd" />
        </mesh>
      ))}
      <Solid size={[0.18, 0.4, 0.35]} position={[0.09, 1.6, -8.4]} color="#9a9da2" />
      <Solid size={[0.18, 0.4, 0.35]} position={[0.09, 1.6, -7.9]} color="#9a9da2" />
    </group>
  )
}

export default function Duplex({ season, lit }) {
  const brick = brickTexture()
  const roof = season.snow ? SNOW : '#cfcbc3'
  return (
    <group>
      <Wall size={[9, 7.6, 12]} position={[-4.5, 3.8, 2]} texture={brick} />
      <Solid size={[8.9, 0.05, 11.9]} position={[-4.5, 7.62, 2]} color={roof} cast={false} />
      <Wall size={[9, 6.6, 6]} position={[-4.5, 3.3, -7]} texture={brick} />
      <Solid size={[8.9, 0.05, 5.9]} position={[-4.5, 6.62, -7]} color={roof} cast={false} />
      <Solid size={[0.45, 0.35, 0.45]} position={[-2.5, 6.8, -6]} color="#d6d3cc" />

      <Facade lit={lit} />
      <SideWall x={0} dir={1} lit={lit} />
      <SideWall x={-9} dir={-1} lit={lit} />
      <Cable />
      <Porch />
      <FrontStair />
      <Utilities />
      <Back roof={roof} lit={lit} />
    </group>
  )
}

// Hidden duplex: just its two volumes, translucent like the other neighbours.
export function DuplexGhost() {
  return (
    <group>
      <Ghost size={[9, 7.6, 12]} position={[-4.5, 3.8, 2]} />
      <Ghost size={[9, 6.6, 6]} position={[-4.5, 3.3, -7]} />
    </group>
  )
}
