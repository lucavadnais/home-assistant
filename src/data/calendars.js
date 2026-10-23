// Google calendars shown in the agenda, through Home Assistant's Google Calendar integration.
// `entity` is the calendar.* entity, `color` tags its events in the list.
export const CALENDARS = [
  { entity: 'calendar.perso', name: 'Perso', color: '#7fb2ff' },
  { entity: 'calendar.vad', name: 'Vad', color: '#b48cff' },
  { entity: 'calendar.birthdays', name: 'Anniversaires', color: '#ff9ec7' },
]

// How far ahead the agenda looks
export const AGENDA_DAYS = 14
