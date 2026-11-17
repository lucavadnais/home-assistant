import RearHouse from './RearHouse'
import Duplex, { DuplexGhost } from './Duplex'
import RightNeighbor, { RightNeighborGhost } from './RightNeighbor'
import Surroundings from './Surroundings'
import Traffic from './Traffic'
import { ROOMS, TREES } from './rooms'

// 6538, the author's home: the back-lot house, the brick duplex and the neighbour in front of it,
// the street with its traffic. The reference for any other house (see ./index.js).

function Model({ rooms, onToggle, season, wind, day, lite, showNeighbors, neighborLit }) {
  return (
    <>
      <Surroundings season={season} wind={wind} />
      {showNeighbors ? <Duplex season={season} lit={neighborLit} /> : <DuplexGhost />}
      {showNeighbors ? <RightNeighbor season={season} lit={neighborLit} /> : <RightNeighborGhost />}
      <RearHouse rooms={rooms} onToggle={onToggle} season={season} />
      <Traffic night={!day} snow={season.snow} movingShadows={!lite} />
    </>
  )
}

export default {
  name: '6538',
  frontAzimuth: 180,
  framing: { target: [-0.5, 3, -1], width: 28, height: 17, minZoom: 10 },
  lot: { x: [-14, 13], z: [-18.5, 21.5] },
  rooms: ROOMS,
  trees: TREES,
  Model,
}
