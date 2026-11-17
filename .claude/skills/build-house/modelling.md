# Modelling a house for this dashboard

## The look

A stylised architectural diorama: a low-poly, faithful model on a block of soil, seen from the street in orthographic projection, slightly from above. Flat colours with a few procedural textures (brick, siding, wood), soft shadows, warm glowing windows at night. Faithful means someone who lives there recognises it at a glance: massing and proportions, roof, cladding and colours, the rhythm and size of the openings, the entrance, the things around it. Detail means real features modelled as such (a bell-shaped door hood, a stone stoop with nosings, an outdoor spiral stair, balcony railings, a cornice), not texture tricks.

Study the reference before you start, the author's house in `src/houses/default/`: `index.jsx` assembles it; `RearHouse.jsx` (the house: footprint, siding, flat roof with parapet, door hood, stoop, back entrance), `Duplex.jsx` (brick façade, porch, a curved outdoor stair, balconies), `Surroundings.jsx` (lot, street, alley, fences, planters, trees), `rooms.js` (its room windows). Match their level of detail and their code style: named dimension constants, small components per feature, a comment saying what each is.

## Conventions

- Units are metres. y is up; the ground is y = 0.
- The front of the house faces +z, toward the viewer; x runs left to right as seen from the street. Real orientation only matters for the sun: set `frontAzimuth` to the compass bearing the real front faces (0 north, 90 east, 180 south, 270 west) and the app turns the sun to match.
- Centre the house near the origin. `lot` is the ground the whole scene covers, neighbours, street and yard included: `{ x: [min, max], z: [min, max] }`. Rain, snow, wind gusts, blowing leaves and the sun's shadows cover all of it, so it must take in every building and the street; widen it whenever you add something past its edge. Keep the scene within about 40 m of the origin: the further shadows reach, the blurrier they get.
- `framing.target` is where the camera looks (roughly the middle of the house, a third of its height up), `width` × `height` the area to fit on screen from the front view (house plus a margin of lot), `minZoom` how far out one may zoom (10 for a lot like 6538's; lower for a bigger scene).
- The camera orbits the target; views from `?view=` (front, right, back, left, corner, top) are what you compare with photos.

## The house module

`src/houses/custom/index.jsx`:

```jsx
import { RoomWindow } from '../../scene/parts'
import House from './House'
import Surroundings from './Surroundings'

// Room windows: Home Assistant area ids from `node scripts/ha-areas.mjs`. Positions are the glass
// centre, just proud of the wall (0.01 m); rotationY turns the window to face out of its wall
// (0 = front, Math.PI = back, Math.PI / 2 = right side, -Math.PI / 2 = left side).
const ROOMS = [
  { area: 'living_room', position: [1.2, 1.9, 4.01], rotationY: 0, size: [1.1, 1.5], frame: '#f2f0ea', trim: true },
]

function Model({ rooms, onToggle, season, wind, day, lite, showNeighbors, neighborLit }) {
  return (
    <>
      <Surroundings season={season} wind={wind} />
      <House season={season} />
      {rooms.map((room) => <RoomWindow key={room.id} room={room} onToggle={onToggle} />)}
    </>
  )
}

export default {
  name: 'Chez nous',
  frontAzimuth: 135,
  framing: { target: [0, 3, 0], width: 26, height: 16, minZoom: 10 },
  lot: { x: [-13, 13], z: [-14, 18] }, // the soil block's footprint: everything stands on it
  rooms: ROOMS,
  trees: [], // entity ids drawn as a Christmas tree in their room's window (e.g. 'switch.sapin')
  Model,
}
```

- `rooms` reach `Model` with `id`, `on`, `offline` and `tree` filled in from Home Assistant; draw each with `RoomWindow`. An area with several windows needs one entry per window, each with its own `id` (e.g. `'living_room:left'`). Don't draw a `StaticWindow` under a room window.
- Areas the user controls but that have no visible window (a basement, a back room) can be left out: their devices still appear in the side list.
- `showNeighbors` is the "Autres bâtiments" setting: draw neighbouring buildings fully when true, as `Ghost` boxes when false (see `DuplexGhost`). `neighborLit(id)` tells whether a neighbour's window is lit at this time: pass `lit={neighborLit('<unit>:<room>')}` to their `StaticWindow`s and the street comes alive at night.
- `day` and `lite` are there if a part needs them (`lite`: weak GPU, see Performance).

## Building blocks to reuse (import, don't edit)

`src/scene/parts.jsx`
- `Solid({ size, color, cast, ...meshProps })`: box. `Wall({ size, texture, color })`: box whose texture keeps real-world scale on every face. `Flat({ size, position: [x, z], color, y })`: patch lying on the ground.
- `StaticWindow({ position, size, rotationY, frame, glass, lintel, trim, lit })`: window or door glass in a frame; `trim` adds a white casing and sill (siding houses), `lintel` a stone lintel of that colour (brick houses), `lit` a neighbour's warm glow with people walking past.
- `RoomWindow({ room, onToggle })`: clickable room window (glow, light spilling outside, Christmas tree).
- `Railing({ length, height, position, rotationY, color, topColor })`: baluster railing.
- `Ghost({ size, position })`: translucent stand-in for a neighbouring building.
- `WindowPeople`: context of silhouettes walking past lit windows (`SILHOUETTES` ids from textures.js); wrap the house in a provider to choose its household.

`src/scene/textures.js`: `brickTexture(tone)`, `sidingTexture()`, `woodTexture()` (vertical planks), `slatTexture(tone)` (horizontal boards), `latticeTexture()`, `barsTexture()`, `numberTexture(text)` (house number), `worldUvBox(w, h, d)`. Textures are cached; pair them with `Wall`.

`src/scene/Plants.jsx`: `Sway` (wraps anything that bends in the wind), `StreetTree`, `Hydrangea`, `FallenLeaves`. `src/houses/default/Surroundings.jsx` has more (conifer, iron fence, wood fence, planters, trellis) as local components: copy what you need into your folder.

`src/scene/seasons.js`: `SEASONS[id]` gives the season's `lawn`, `courtyard`, `bed`, `plant` colours, `tree` foliage (null in winter), `hydrangea`, `fallenLeaves`, and `snow` (true in winter). In winter, cover roofs, ledges and the lawn with `SNOW`, as RearHouse and Surroundings do, on the neighbours too.

Weather (rain, snow, wind, lightning) and the sky are drawn by the app over the house's `lot`: don't add your own.

`src/houses/default/Traffic.jsx` drives cars along 6538's street; reuse it only if your street is laid out at the same place, otherwise copy and adapt it.

Shapes beyond boxes: plain three.js geometry in JSX (`coneGeometry` with 4 radial segments for a pyramid, `cylinderGeometry`, `extrudeGeometry` from a `THREE.Shape` for gables and odd profiles, `latheGeometry` for round things). Pitched roofs: build the slopes and gable triangles from an extruded triangle or a small `BufferGeometry`; give gable ends the wall material.

## Reading the photos

- Front, back, left, right: the façades, each as seen standing in front of it. Left and right are as seen when facing the front of the house.
- Corner: two façades at once; use it to relate their depths and heights.
- Aerial (satellite, drone): footprint shape, roof shape and ridge directions, extensions, the lot.
- Room window: which window belongs to which room. Find that window in the façade photos to place it.
- Entrance, detail, material: close-ups for shapes, colours and textures.
- Plan or sketch: trust its dimensions over the photos.

Parts no photo shows still have to exist: give them a plain, plausible treatment consistent with the rest, and tell the user what you assumed.

Colours: read them from the photos but correct for lighting (shade, overcast sky and white balance make walls look darker or bluer than they are); prefer the colour the owner would name.

## Estimating sizes

Photos have no ruler. Estimate from things whose size is known, and cross-check every estimate against the others:

- A storey is about 2.7–3.0 m floor to floor in houses, 3.0–3.5 m in older plexes.
- A front door is about 0.9 m wide and 2.0–2.1 m high; a garage door about 2.4–2.7 m wide per car and 2.1–2.3 m high.
- Window sills sit about 0.8–1.0 m above their floor; window heads line up near 2.1 m above it.
- A step is about 0.18 m high and 0.28 m deep; a railing about 0.9–1.07 m high.
- A brick course is about 7.5 cm; lap siding shows about 10–20 cm per board.
- A car is about 4.5 m long and 1.5 m high; an adult about 1.7 m.

The owner's numbers (floors, dimensions) win over any estimate. Perspective makes the far end of a wall look smaller and verticals converge: undo it before measuring. Count windows and bays carefully and reproduce their spacing; openings on one floor share a sill height, stacked windows line up when they do in the photos, and the side walls' depth agrees with the corner and aerial views.

## Performance

The dashboard often runs on a TV box (`?lite` mode: native resolution, 30 fps, shadows redrawn only when the scene changes). Keep it light:

- Memoise built geometry (`useMemo`); never allocate in `useFrame`.
- Repeated small parts (balusters, bricks, shingles) belong in a texture or a single merged mesh, not hundreds of meshes.
- Anything that moves on its own must not cast shadows (in lite mode its shadow would stay behind): `castShadow={false}`, like Traffic's `movingShadows`.
- Check `?lite` too before handing over.
