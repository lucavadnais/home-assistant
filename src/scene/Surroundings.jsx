import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { Flat, Solid, Wall } from './parts'
import { latticeTexture, numberTexture, slatTexture, woodTexture } from './textures'
import { SNOW } from './seasons'
import { FallenLeaves, Hydrangea, StreetTree, Sway } from './Plants'

// Plot x -14..13, z -18.5..21.5. Street along +z (parking lane + one-way lane), back lane along -z,
// side alley along the west edge (x -13.6..-10.2) joining the two.
// The passage to 6538 runs between the duplex (x < 0) and the right-hand neighbour (x > 3.4).

function Plot({ season }) {
  return (
    <group>
      <RoundedBox args={[27, 1.6, 40]} radius={0.4} position={[-0.5, -0.8, 1.5]} receiveShadow>
        <meshStandardMaterial color="#5a4632" roughness={1} />
      </RoundedBox>
      <Flat size={[26.7, 34.2]} position={[-0.5, -1.25]} color={season.lawn} y={0.01} />

      <Flat size={[26.7, 7]} position={[-0.5, 18]} color="#2d3036" />
      <Flat size={[27, 1.7]} position={[-0.5, 13.65]} color="#a9a7a1" />
      {/* Curb, lowered where the side alley meets the street */}
      <Solid size={[23.2, 0.14, 0.2]} position={[1.4, 0.07, 14.55]} color="#bdbab3" cast={false} />
      <Solid size={[3.4, 0.03, 0.2]} position={[-11.9, 0.015, 14.55]} color="#bdbab3" cast={false} />
      {/* Line between the parking lane and the driving lane */}
      {Array.from({ length: 9 }, (_, i) => (
        <Flat key={i} size={[1.4, 0.1]} position={[-12.6 + i * 3, 17.25]} color="#d9d4c3" y={0.025} />
      ))}
      <Flat size={[27, 2.3]} position={[-0.5, -17.35]} color="#33363c" />
      <SideAlley season={season} />

      <Flat size={[13, 2.6]} position={[-3.5, 11.5]} color={season.bed} />
      <Flat size={[9, 6]} position={[-4.5, -13]} color={season.snow ? SNOW : '#8a6a4a'} />
    </group>
  )
}

// Side alley along the west edge, from the back lane to the sidewalk: worn asphalt with
// patches and weeds along the edges. Single lane, no markings.
function SideAlley({ season }) {
  const patches = [[-12.4, 6, 1.6, 2.4], [-11.2, -3.5, 1.2, 1.8], [-12.1, -10.5, 2, 1.4]]
  const weeds = [[-13.5, 9], [-13.5, 2.5], [-10.3, -1], [-13.5, -7], [-10.3, -12.5], [-10.3, 5]]
  return (
    <group>
      <Flat size={[3.4, 29]} position={[-11.9, -1.7]} color="#3a3d42" />
      {patches.map(([x, z, w, d]) => (
        <Flat key={`${x}${z}`} size={[w, d]} position={[x, z]} color="#2c2f33" y={0.025} />
      ))}
      {/* Two concrete blocks across the entrance keep cars out (pedestrians and bikes pass between) */}
      {[-12.85, -10.95].map((x) => (
        <group key={x} position={[x, 0, 9.5]}>
          <Solid size={[1.5, 0.75, 0.75]} position={[0, 0.375, 0]} color="#b4b1a9" />
          {season.snow && <Solid size={[1.45, 0.06, 0.7]} position={[0, 0.78, 0]} color={SNOW} cast={false} />}
        </group>
      ))}
      {!season.snow && weeds.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.08, z]} scale={[1, 0.5, 1.6]}>
          <icosahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color={season.plant} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

// Street entrance to 6538: cedar plank gate under a timber frame. The door is the left-hand part,
// in line with the walk (world x 0.1..1.25), with the black mailbox and the latch; the rest is fixed.
function Gate() {
  const frame = '#a88a64'
  return (
    <group position={[1.7, 0, 8]}>
      <Wall size={[3.1, 1.85, 0.05]} position={[0, 0.98, 0]} texture={woodTexture()} />
      <Solid size={[0.12, 2.4, 0.12]} position={[-1.6, 1.2, 0]} color={frame} />
      <Solid size={[0.12, 2.4, 0.12]} position={[1.6, 1.2, 0]} color={frame} />
      <Solid size={[0.12, 2.4, 0.12]} position={[-0.45, 1.2, 0.05]} color={frame} />
      <Solid size={[3.4, 0.12, 0.14]} position={[0, 2.4, 0]} color={frame} />

      <group position={[-1.05, 1.25, 0.11]}>
        <Solid size={[0.44, 0.3, 0.17]} color="#1b1d21" />
        <mesh position={[0, -0.03, 0.09]}>
          <planeGeometry args={[0.42, 0.16]} />
          <meshStandardMaterial map={numberTexture('6538')} transparent />
        </mesh>
      </group>
      <Solid size={[0.04, 0.18, 0.04]} position={[-0.6, 1.05, 0.05]} color="#1b1d21" />
    </group>
  )
}

// Front walk from the sidewalk to the gate, in line with the walk behind it (x 0..WALK):
// concrete slabs with one step up near the gate, between two low black wrought-iron fences.
function FrontWalk() {
  const x = WALK / 2
  return (
    <group>
      <Flat size={[WALK, 3.2]} position={[x, 11.2]} color="#b9b4aa" y={0.04} />
      <Solid size={[WALK, 0.14, 1.6]} position={[x, 0.07, 8.8]} color="#bdb8ae" />
      <IronFence length={4.5} position={[-0.1, 10.45]} />
      <IronFence length={4.5} position={[x + WALK / 2 + 0.15, 10.45]} />
      {/* Along the sidewalk, from the walk's fence to the neighbour's railing */}
      <IronFence length={2.15} position={[2.43, 12.7]} rotationY={Math.PI / 2} />
    </group>
  )
}

// Low wrought-iron fence running along z (turn it with `rotationY`): square pickets with pointed tips between two rails,
// posts at both ends. Real geometry, so it reads from any angle (a flat railing vanishes edge-on).
function IronFence({ length, position, height = 0.9, rotationY = 0 }) {
  const iron = '#1b1d21'
  const pickets = Math.round(length / 0.13)
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotationY, 0]}>
      {Array.from({ length: pickets }, (_, i) => {
        const z = -length / 2 + ((i + 0.5) * length) / pickets
        return (
          <group key={i} position={[0, 0, z]}>
            <Solid size={[0.02, height, 0.02]} position={[0, height / 2, 0]} color={iron} cast={false} />
            <mesh position={[0, height + 0.04, 0]}>
              <coneGeometry args={[0.025, 0.08, 4]} />
              <meshStandardMaterial color={iron} />
            </mesh>
          </group>
        )
      })}
      {[0.1, height - 0.08].map((y) => (
        <Solid key={y} size={[0.03, 0.03, length]} position={[0, y, 0]} color={iron} cast={false} />
      ))}
      {[-length / 2, length / 2].map((z) => (
        <Solid key={z} size={[0.05, height + 0.1, 0.05]} position={[0, (height + 0.1) / 2, z]} color={iron} />
      ))}
    </group>
  )
}

// Passage from the street gate to the courtyard of 6538 (see the photo from 6538's upper floor).
// Duplex side (x = 0): concrete walk from the gate to the stoop, wooden lattice on the brick.
// Right-hand side: mulch bed with plants and three square stepping stones, a black trellis with
// a climber at the neighbour's corner, a grey bin shed by the gate.
const WALK = 1.2

// Black steel grid trellis at the neighbour's corner, a climber growing up it.
function Trellis({ season }) {
  const steel = '#1b1d21'
  return (
    <group position={[3.15, 0, -5.4]}>
      {[-0.45, -0.15, 0.15, 0.45].map((z) => (
        <Solid key={z} size={[0.025, 1.8, 0.025]} position={[0, 0.9, z]} color={steel} cast={false} />
      ))}
      {[0.3, 0.65, 1.0, 1.35, 1.7].map((y) => (
        <Solid key={y} size={[0.025, 0.025, 0.95]} position={[0, y, 0]} color={steel} cast={false} />
      ))}
      {!season.snow && [[0.4, -0.2, 0.28], [0.9, 0.15, 0.25], [1.3, -0.1, 0.22], [1.6, 0.25, 0.18]].map(([y, z, r]) => (
        <mesh key={y} position={[0.05, y, z]} scale={[0.6, 1, 1]} castShadow>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={season.plant} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

// Diagonal wooden lattice panel on a wall facing +x; `size` is [width along z, height].
function WallLattice({ position, size }) {
  const [w, h] = size
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * 1.5, uv.getY(i) * h * 1.5)
    return g
  }, [w, h])
  return (
    <mesh geometry={geometry} position={position} rotation={[0, Math.PI / 2, 0]}>
      <meshStandardMaterial map={latticeTexture()} color="#d9c9a8" alphaTest={0.5} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Passage({ season }) {
  const bedPlants = [[2.9, 6.5, 0.2], [3.1, 4.8, 0.16], [2.7, 3.2, 0.22], [3.0, 2.2, 0.15], [3.1, -0.8, 0.18], [3.0, -2.0, 0.2]]
  return (
    <group>
      {/* Concrete walk along the duplex, from the gate to the stoop of 6538 */}
      <Flat size={[WALK, 16.24]} position={[WALK / 2, -0.12]} color="#b9b4aa" y={0.04} />
      {/* Mulch bed along the right-hand neighbour */}
      <Flat size={[3.4 - WALK, 14]} position={[(3.4 + WALK) / 2, 1]} color={season.bed} y={0.02} />

      {/* Three square stepping stones crossing the bed diagonally */}
      {[[2.0, -0.9], [2.5, 0.0], [2.05, 0.9]].map(([x, z]) => (
        <mesh key={z} position={[x, 0.035, z]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} receiveShadow>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial color={season.snow ? SNOW : '#c4bfb4'} roughness={1} />
        </mesh>
      ))}
      {!season.snow && bedPlants.map(([x, z, r]) => (
        <mesh key={`${x}${z}`} position={[x, r * 0.6, z]} scale={[1, 0.7, 1]} castShadow>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={season.plant} flatShading roughness={1} />
        </mesh>
      ))}

      <Trellis season={season} />
      <WallLattice position={[0.04, 1.9, -2.6]} size={[0.55, 2.2]} />

      {/* Grey bin shed by the gate */}
      <group position={[2.85, 0, 7.35]}>
        <Wall size={[0.9, 1.2, 0.85]} position={[0, 0.6, 0]} texture={slatTexture('#8b8e92')} />
        <Solid size={[0.98, 0.06, 0.93]} position={[0, 1.23, 0]} color={season.snow ? SNOW : '#5f6266'} />
      </group>
    </group>
  )
}

// Hostas, ivy and flagstones in front of 6538.
function Courtyard({ season }) {
  const stones = [
    [3.6, -8.6, 0.45], [4.6, -7.9, 0.38], [3.8, -7.3, 0.42], [5.2, -6.9, 0.35], [4.4, -6.5, 0.4],
  ]
  const hostas = [[3.4, -9.4, 0.55], [4.3, -9.5, 0.5], [5.3, -9.3, 0.6], [5.5, -8.4, 0.45]]
  return (
    <group>
      <Flat size={[6, 4]} position={[3, -8]} color={season.courtyard} y={0.03} />
      {stones.map(([x, z, r]) => (
        <mesh key={`${x}${z}`} position={[x, 0.05, z]} scale={[1, 1, 0.75]} receiveShadow>
          <cylinderGeometry args={[r, r, 0.05, 7]} />
          <meshStandardMaterial color="#a3a096" roughness={1} />
        </mesh>
      ))}
      {!season.snow && hostas.map(([x, z, r]) => (
        <mesh key={`${x}${z}`} position={[x, r * 0.45, z]} scale={[1, 0.55, 1]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={season.plant} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

// Back yard of the duplex, as seen from the lane: wooden planters and a blue parasol behind a
// red-stained fence with a lattice top, and a planter on the lane side.
function DuplexYard({ season, wind }) {
  return (
    <group>
      {[-8, -6.6, -5.2, -3.8].map((x) => (
        <Solid key={x} size={[1.1, 0.6, 0.6]} position={[x, 0.3, -15.4]} color="#b07a45" />
      ))}
      {/* Parasol is put away for the winter */}
      {!season.snow && (
        // Pivots in the table's hole, so the pole leans and the canopy flaps on top of it
        <Sway wind={wind} stiffness={1.3} phase={0.7} position={[-3.4, 0.7, -13.6]}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 2.2, 6]} />
            <meshStandardMaterial color="#ddd" />
          </mesh>
          <Sway wind={wind} stiffness={1.5} phase={2.4} position={[0, 1.5, 0]}>
            <mesh position={[0, 0.05, 0]} castShadow>
              <coneGeometry args={[1.3, 0.5, 8]} />
              <meshStandardMaterial color="#3d6fb0" />
            </mesh>
          </Sway>
        </Sway>
      )}
      <Solid size={[0.9, 0.05, 0.9]} position={[-3.4, 0.7, -13.6]} color="#e8e6e0" />

      <Fence length={10} position={[-5, -16.15]} />
      <Fence length={6} position={[-9.95, -13.1]} rotationY={Math.PI / 2} />
      <LanePlanter season={season} wind={wind} />
    </group>
  )
}

const FENCE_STAIN = '#8a3f2c'

// Horizontal-slat fence with a lattice band on top; `position` is [x, z] of its centre.
function Fence({ length, position, rotationY = 0 }) {
  const lattice = useMemo(() => {
    const g = new THREE.PlaneGeometry(length, 0.4)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * length * 2, uv.getY(i) * 0.8)
    return g
  }, [length])
  const posts = Math.round(length / 2) + 1
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotationY, 0]}>
      <Wall size={[length, 1.5, 0.05]} position={[0, 0.75, 0]} texture={slatTexture(FENCE_STAIN)} />
      <mesh geometry={lattice} position={[0, 1.75, 0]}>
        <meshStandardMaterial map={latticeTexture()} color={FENCE_STAIN} alphaTest={0.5} side={THREE.DoubleSide} />
      </mesh>
      <Solid size={[length, 0.06, 0.1]} position={[0, 1.53, 0]} color={FENCE_STAIN} />
      <Solid size={[length, 0.06, 0.12]} position={[0, 1.98, 0]} color={FENCE_STAIN} />
      {Array.from({ length: posts }, (_, i) => (
        <Solid key={i} size={[0.1, 2.0, 0.1]} position={[-length / 2 + (i * length) / (posts - 1), 1.0, 0]} color="#6e3324" />
      ))}
    </group>
  )
}

// Wooden planter box against the fence on the lane side.
function LanePlanter({ season, wind }) {
  return (
    <group position={[-4.6, 0, -16.6]}>
      <Wall size={[1.8, 0.65, 0.65]} position={[0, 0.33, 0]} texture={slatTexture('#b8a58a')} />
      <Solid size={[1.7, 0.02, 0.55]} position={[0, 0.62, 0]} color={season.snow ? SNOW : '#4a3a2c'} cast={false} />
      {!season.snow && [-0.6, -0.1, 0.5].map((x) => (
        <Sway key={x} wind={wind} stiffness={0.8} phase={x * 3} position={[x, 0.63, 0]}>
          <mesh position={[0, 0.22, 0]} scale={[1, 0.8, 1]} castShadow>
            <icosahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color={season.plant} flatShading roughness={1} />
          </mesh>
        </Sway>
      ))}
    </group>
  )
}

function Conifer({ position, snow, wind }) {
  const tiers = [[2.4, 3, 2.8], [1.9, 2.6, 4.6], [1.4, 2.2, 6.2], [0.8, 1.8, 7.6]]
  return (
    <Sway wind={wind} stiffness={0.5} phase={1.3} position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 2, 6]} />
        <meshStandardMaterial color="#5b4030" />
      </mesh>
      {tiers.map(([r, h, y]) => (
        <group key={y} position={[0, y, 0]}>
          <mesh castShadow>
            <coneGeometry args={[r, h, 9]} />
            <meshStandardMaterial color="#2c5530" flatShading roughness={1} />
          </mesh>
          {snow && (
            <mesh position={[0, h * 0.28, 0]}>
              <coneGeometry args={[r * 0.62, h * 0.46, 9]} />
              <meshStandardMaterial color={SNOW} flatShading roughness={1} />
            </mesh>
          )}
        </group>
      ))}
    </Sway>
  )
}

export default function Surroundings({ season, wind }) {
  return (
    <group>
      <Plot season={season} />
      <Gate />
      <FrontWalk />
      <Hydrangea position={[4.3, 0, 12.1]} {...season.hydrangea} snow={season.snow} wind={wind} />
      <StreetTree foliage={season.tree} snow={season.snow} wind={wind} />
      {season.fallenLeaves && <FallenLeaves colors={season.fallenLeaves} />}
      <Passage season={season} />
      <Courtyard season={season} />
      <DuplexYard season={season} wind={wind} />

      {/* Wrought-iron fences along the sidewalk, matching the ones by the front walk */}
      <IronFence length={3.6} position={[-8.2, 12.7]} rotationY={Math.PI / 2} />
      <IronFence length={1.4} position={[-3.1, 12.7]} rotationY={Math.PI / 2} />
      <IronFence length={9} position={[8, 12.7]} rotationY={Math.PI / 2} />

      <Conifer position={[5.9, 0, 10.8]} snow={season.snow} wind={wind} />
    </group>
  )
}
