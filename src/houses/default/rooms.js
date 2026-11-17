// Rooms of 6538 (the back-lot house). Each room owns one window: `position` is the
// window centre on the wall, `rotationY` turns it to face outward
// (0 = front/courtyard, PI = back lane).
// Positions are measured off the front and back photos.
// `area` is the Home Assistant area id: every device in that area belongs to the window (only the
// device types ticked in the display settings).
// Clicking it switches them together; the glass glows while any of them (other than a tree) is on.
const FRONT = 0
const BACK = Math.PI
const BROWN = '#6b3a2a'

export const ROOMS = [
  { area: 'living_room', position: [2.8, 2.25, -9.99], rotationY: FRONT, size: [0.85, 1.35], frame: BROWN, trim: true },
  { area: 'office', position: [1.8, 4.9, -16.01], rotationY: BACK, size: [0.85, 1.35], frame: BROWN, trim: true },
  { area: 'bedroom', position: [2.7, 4.75, -9.99], rotationY: FRONT, size: [0.85, 1.35], frame: BROWN, trim: true },
  { area: 'porch', position: [1.42, 2.7, -9.98], rotationY: FRONT, size: [0.16, 0.24] },
]

// Entities drawn as a twinkling Christmas tree in their room's window while on.
export const TREES = ['switch.christmas_tree']

// The rest of 6538's windows and outdoor lamps: drawn on the house, but not controllable.
// Move one into ROOMS (with its area) once a light there is connected.
export const WINDOWS = [
  { id: 'cuisine', position: [2.4, 2.5, -16.01], rotationY: BACK, size: [0.9, 0.95], frame: BROWN, trim: true },
  { id: 'salle-a-manger', position: [0.75, 2.5, -16.01], rotationY: BACK, size: [0.9, 0.95], frame: BROWN, trim: true },
  { id: 'lampe-arriere', position: [3.8, 3.1, -16.02], rotationY: BACK, size: [0.2, 0.22] },
]
