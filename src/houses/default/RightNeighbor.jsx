import { Ghost, Railing, Solid, StaticWindow, Wall, WindowPeople } from '../../scene/parts'
import { SILHOUETTES, brickTexture } from '../../scene/textures'
import { SNOW } from '../../scene/seasons'

// Right-hand neighbour: two-storey orange-brick duplex with a wide white eave, flat roof.
// Main block x 3.4..12.6, z -6..8 (facade at z = 8), rear block x 6..12.6, z -10..-6.
// West half (passage side): bay window over white panelling, raised ground floor, barred basement window.
// East half: French door on a wrought-iron balcony, entrance doors up a short stair.
const FACADE = 8
const GROUND = 1.2
const UPPER = 3.8
const WHITE = '#f1efe9'
const IRON = '#1b1d21'
// Units for the neighbour-lights simulation: one household per floor.
const UNIT = { ground: 'droite-rdc', upper: 'droite-etage' }

function WestBay({ lit }) {
  const x = 5.7
  return (
    <group>
      <Solid size={[4.6, GROUND, 0.06]} position={[x, GROUND / 2, FACADE + 0.03]} color={WHITE} cast={false} />
      <StaticWindow position={[5.2, 0.6, FACADE + 0.07]} size={[1.3, 0.5]} frame={WHITE} lit={lit(`${UNIT.ground}:sous-sol`)} />
      <Railing length={1.3} height={0.5} position={[5.2, 0.35, FACADE + 0.1]} />

      <StaticWindow position={[x, GROUND + 1.2, FACADE + 0.01]} size={[2.2, 1.5]} frame={WHITE} lintel={WHITE} lit={lit(`${UNIT.ground}:salon`)} />

      {/* White panelled band with the upstairs bay window */}
      <Solid size={[3.6, 2.6, 0.08]} position={[x, UPPER + 1.5, FACADE + 0.04]} color={WHITE} />
      <StaticWindow position={[x, UPPER + 1.85, FACADE + 0.1]} size={[3.0, 1.5]} frame={WHITE} lit={lit(`${UNIT.upper}:salon`)} />
      <Solid size={[3.4, 0.08, 0.25]} position={[x, UPPER + 1.05, FACADE + 0.15]} color={WHITE} />
    </group>
  )
}

function EastEntrance({ lit }) {
  const doorX = 9.9
  const steps = 5
  const rise = GROUND / steps
  const run = 0.3
  const landing = 1.0
  return (
    <group>
      {/* Doors: dark wood main door, green side door, lamp between */}
      <StaticWindow position={[doorX, GROUND + 1.05, FACADE + 0.01]} size={[0.95, 2.1]} frame={WHITE} glass="#3a2418" />
      <StaticWindow position={[11.6, GROUND + 0.95, FACADE + 0.01]} size={[0.8, 1.9]} frame="#4a7a55" glass="#2a3530" />
      <mesh position={[doorX, GROUND + 2.45, FACADE + 0.15]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color="#e8dcc0" emissive="#ffcf87" emissiveIntensity={0.4} />
      </mesh>

      {/* Landing and steps down toward the street */}
      <Solid size={[2.8, GROUND, landing]} position={[10.6, GROUND / 2, FACADE + landing / 2]} color="#4a4d52" />
      {Array.from({ length: steps - 1 }, (_, i) => {
        const top = GROUND - rise * (i + 1)
        return <Solid key={i} size={[1.4, top, run]} position={[doorX, top / 2, FACADE + landing + run * (i + 0.5)]} color="#4a4d52" />
      })}
      <Railing length={landing} height={0.9} position={[doorX - 0.72, GROUND, FACADE + landing / 2]} rotationY={Math.PI / 2} color={IRON} />

      {/* Stone low wall closing the stair on the east side */}
      <Solid size={[0.5, 1.4, 2.4]} position={[12.3, 0.7, FACADE + 1.2]} color="#9a978f" />

      {/* Upstairs French door and its small wrought-iron balcony on a white slab */}
      <StaticWindow position={[10.4, UPPER + 1.15, FACADE + 0.01]} size={[0.95, 2.1]} frame={WHITE} lit={lit(`${UNIT.upper}:chambre`)} />
      <Solid size={[2.2, 0.25, 1.0]} position={[10.4, UPPER - 0.12, FACADE + 0.5]} color={WHITE} />
      <Railing length={2.2} height={0.95} position={[10.4, UPPER, FACADE + 0.97]} color={IRON} />
      {[9.32, 11.48].map((x) => (
        <Railing key={x} length={1.0} height={0.95} position={[x, UPPER, FACADE + 0.5]} rotationY={Math.PI / 2} color={IRON} />
      ))}
    </group>
  )
}

const RESIDENTS = [SILHOUETTES.stocky]

export default function RightNeighbor({ season, lit }) {
  const brick = brickTexture('#b5653f')
  const roof = season.snow ? SNOW : '#cfcbc3'
  return (
    <group>
      <Wall size={[9.2, 7, 14]} position={[8, 3.5, 1]} texture={brick} />
      <Wall size={[6.6, 6.5, 4]} position={[9.3, 3.25, -8]} texture={brick} />

      {/* Wide white eave around the flat roof */}
      <Solid size={[9.8, 0.45, 14.6]} position={[8, 7.15, 1]} color={WHITE} />
      <Solid size={[9.7, 0.04, 14.5]} position={[8, 7.4, 1]} color={roof} cast={false} />
      <Solid size={[6.6, 0.05, 4]} position={[9.3, 6.53, -8]} color={roof} cast={false} />

      {/* A single, stockier resident walks past these windows */}
      <WindowPeople.Provider value={RESIDENTS}>
        <WestBay lit={lit} />
        <EastEntrance lit={lit} />
      </WindowPeople.Provider>
    </group>
  )
}

// Hidden: just its two volumes, translucent.
export function RightNeighborGhost() {
  return (
    <group>
      <Ghost size={[9.2, 7, 14]} position={[8, 3.5, 1]} />
      <Ghost size={[6.6, 6.5, 4]} position={[9.3, 3.25, -8]} />
    </group>
  )
}
