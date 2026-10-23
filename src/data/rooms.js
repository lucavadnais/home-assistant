// Rooms of 6538 (the back-lot house). Each room owns one window: `position` is the
// window centre on the wall, `rotationY` turns it to face outward
// (0 = front/courtyard, PI = back lane).
// Positions are measured off the front and back photos.
// `entity` links a room to its Home Assistant entity (e.g. 'light.salon'); the room always mirrors it.
const FRONT = 0
const BACK = Math.PI
const BROWN = '#6b3a2a'

// Only rooms whose light is in Home Assistant; add one here when a new light is connected.
export const ROOMS = [
  { id: 'salon', name: 'Salon', position: [2.8, 2.25, -9.99], rotationY: FRONT, size: [0.85, 1.35], frame: BROWN, trim: true, entity: 'light.living_room_lamp' },
  { id: 'bureau', name: 'Bureau', position: [1.8, 4.9, -16.01], rotationY: BACK, size: [0.85, 1.35], frame: BROWN, trim: true, entity: 'switch.office_light_socket_1' },
  { id: 'chambre', name: 'Chambre', position: [2.7, 4.75, -9.99], rotationY: FRONT, size: [0.85, 1.35], frame: BROWN, trim: true, entity: 'light.bedroom_light' },
  { id: 'exterieur', name: 'Exterieur', position: [1.42, 2.7, -9.98], rotationY: FRONT, size: [0.16, 0.24], entity: 'light.porch_light' },

]

// The rest of 6538's windows and outdoor lamps: drawn on the house, but not controllable.
// Move one into ROOMS (with its entity) once its light is connected.
export const WINDOWS = [
  { id: 'cuisine', position: [2.4, 2.5, -16.01], rotationY: BACK, size: [0.9, 0.95], frame: BROWN, trim: true },
  { id: 'salle-a-manger', position: [0.75, 2.5, -16.01], rotationY: BACK, size: [0.9, 0.95], frame: BROWN, trim: true },
  { id: 'lampe-arriere', position: [3.8, 3.1, -16.02], rotationY: BACK, size: [0.2, 0.22] },
]
