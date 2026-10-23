import { Solid, Wall, Railing, RoomWindow, StaticWindow } from './parts'
import { sidingTexture } from './textures'
import { SNOW } from './seasons'
import { WINDOWS } from '../data/rooms'

// 6538: two-storey back-lot house in white vinyl siding, flat roof.
// Footprint x 0..6, z -16..-10; front faces the courtyard (+z). Ground floor is raised 0.9 m.
// The east strip (x > 4.8) is set back from the lane by 1.2 m and holds the back door.
const FRONT = -10
const FLOOR = 0.9
const TOP = 6.5
const RECESS_X = 4.8
const RECESS_Z = -14.8
// Front door and stoop, centred on the passage walk (x 0..1.2); 0.1 in from the duplex wall so
// the stoop clears the gas pipes on it.
export const DOOR_X = 0.7

// Main volume plus the recessed back strip; `inset` shrinks or grows both footprints.
function Footprint({ y, height, inset = 0, render }) {
  // The back strip overlaps 0.5 m into the main volume so the two read as one shape.
  const back = -16 + inset / 2
  const front = RECESS_Z + 0.5
  const blocks = [
    { size: [6 - inset, height, 4.8 - inset], position: [3, y, -12.4] },
    { size: [RECESS_X - inset, height, front - back], position: [RECESS_X / 2, y, (front + back) / 2] },
  ]
  return blocks.map((b, i) => <group key={i}>{render(b)}</group>)
}

// Back door in the recessed strip, with its small canopy and wooden landing.
function BackEntrance() {
  const x = 5.4
  return (
    <group>
      <StaticWindow position={[x, FLOOR + 1.0, RECESS_Z - 0.01]} rotationY={Math.PI} size={[0.65, 1.95]} frame="#f2f0ea" glass="#2b3540" />
      <Solid size={[0.95, 0.08, 0.45]} position={[x, FLOOR + 2.25, RECESS_Z - 0.22]} color="#e8e6e0" />
      <Solid size={[1.2, FLOOR, 1.15]} position={[x, FLOOR / 2, RECESS_Z - 0.6]} color="#b07a45" />
      {[1, 2].map((i) => {
        const top = FLOOR - 0.3 * i
        return <Solid key={i} size={[1.0, top, 0.3]} position={[x, top / 2, -16 - 0.3 * (i - 0.5)]} color="#a06c3c" />
      })}
    </group>
  )
}

// Montreal-style bell hood over the front door: shingled pyramid on a red fascia. Narrowed to
// the door so it doesn't run into the duplex wall at x = 0.
function DoorHood({ position }) {
  return (
    <group position={position} scale={[0.8, 1, 1]}>
      <mesh position={[0, -0.1, 0.36]}>
        <boxGeometry args={[1.6, 0.06, 0.7]} />
        <meshStandardMaterial color="#d9cbb3" />
      </mesh>
      <mesh position={[0, 0, 0.38]} castShadow>
        <boxGeometry args={[1.75, 0.16, 0.78]} />
        <meshStandardMaterial color="#9c3f32" />
      </mesh>
      {/* Square pyramid: turned 45° first so its base is axis-aligned, then stretched to the fascia */}
      <group position={[0, 0.38, 0.38]} scale={[1.25, 0.6, 0.56]}>
        <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1, 1, 4]} />
          <meshStandardMaterial color="#3b3f45" roughness={1} flatShading />
        </mesh>
      </group>
    </group>
  )
}

// Stone stoop: landing at door height, three steps down toward the courtyard.
function Stoop() {
  const rise = FLOOR / 4
  const run = 0.32
  return (
    <group>
      <Solid size={[1.2, FLOOR, 0.8]} position={[DOOR_X, FLOOR / 2, FRONT + 0.4]} color="#9a958c" />
      {[1, 2, 3].map((i) => {
        const top = FLOOR - rise * i
        const z = FRONT + 0.8 + run * (i - 0.5)
        return (
          <group key={i}>
            <Solid size={[1.2, top, run]} position={[DOOR_X, top / 2, z]} color="#9a958c" />
            <Solid size={[1.0, 0.02, run - 0.08]} position={[DOOR_X, top + 0.01, z]} color="#22252a" cast={false} />
          </group>
        )
      })}
      <Solid size={[0.35, FLOOR + 0.1, 1.4]} position={[DOOR_X + 0.78, (FLOOR + 0.1) / 2, FRONT + 0.7]} color="#a8a399" />
      <Railing length={0.8} height={0.9} position={[DOOR_X + 0.63, FLOOR + 0.1, FRONT + 0.4]} rotationY={Math.PI / 2} />
    </group>
  )
}

export default function RearHouse({ rooms, onToggle, season }) {
  return (
    <group>
      <Footprint y={FLOOR / 2} height={FLOOR} inset={-0.06} render={(b) => <Solid {...b} color="#8d8a84" />} />
      <Footprint
        y={(TOP + FLOOR) / 2}
        height={TOP - FLOOR}
        render={(b) => <Wall {...b} texture={sidingTexture()} />}
      />

      {/* Flat roof: dark parapet rim, pale membrane, roof hatch */}
      <Footprint y={TOP + 0.12} height={0.25} inset={-0.2} render={(b) => <Solid {...b} color="#22262b" />} />
      <Footprint y={TOP + 0.26} height={0.04} inset={0.3} render={(b) => <Solid {...b} color={season.snow ? SNOW : '#d3d0c8'} cast={false} />} />
      <Solid size={[1, 0.5, 1]} position={[4.6, TOP + 0.5, -13.8]} color="#cfccc4" />

      <BackEntrance />

      {/* Front door */}
      <group position={[DOOR_X, FLOOR + 1.03, FRONT + 0.01]}>
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[1.05, 2.2]} />
          <meshStandardMaterial color="#f2f0ea" />
        </mesh>
        <mesh>
          <planeGeometry args={[0.85, 2.05]} />
          <meshStandardMaterial color="#e4e1d9" roughness={0.6} />
        </mesh>
        <mesh position={[0.32, -0.05, 0.03]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#b0b3b8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      <DoorHood position={[DOOR_X, FLOOR + 2.35, FRONT]} />
      <Stoop />

      {WINDOWS.map(({ id, ...w }) => (
        <StaticWindow key={id} {...w} />
      ))}
      {rooms.map((room) => (
        <RoomWindow key={room.id} room={room} onToggle={onToggle} />
      ))}
    </group>
  )
}
