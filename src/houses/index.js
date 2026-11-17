import home6538 from './default'

// The house the app draws. Every house is a module with the same shape:
//
//   name          its name
//   frontAzimuth  compass bearing its front faces, degrees (0 north, 90 east, 180 south…).
//                 The model's front always faces +z, toward the viewer; the sun is turned to match.
//   framing       starting view: { target: [x, y, z] the camera looks at, width and height of the
//                 world area to fit on screen, minZoom how far out one may zoom }
//   lot           ground the whole scene covers, neighbours and street included:
//                 { x: [min, max], z: [min, max] }. Rain, snow, wind and the sun's shadows cover
//                 it all, not just the house.
//   rooms         windows tied to Home Assistant areas, clickable to switch their room:
//                 [{ area, position: [x, y, z] (glass centre), rotationY (0 faces +z), size: [w, h],
//                    frame?, trim?, id? (needed when an area has several windows) }]
//   trees         entity ids drawn as a twinkling Christmas tree in their room's window
//   Model         React component drawing everything: the house, its lot, its surroundings.
//                 Props: rooms (the above, with on / offline / tree set from Home Assistant),
//                 onToggle(id), season (SEASONS entry), wind (0–1), day, lite, showNeighbors,
//                 neighborLit (for neighbours' windows). It draws each of `rooms` with RoomWindow.
//
// 6538, in ./default, is the author's home and the reference. Someone else's house (written by the /build-house
// Claude Code command) lives in ./custom/index.jsx, which git ignores; when it exists, it's drawn.
const custom = Object.values(import.meta.glob('./custom/index.jsx', { eager: true, import: 'default' }))[0]

export const HOUSE = custom ?? home6538
