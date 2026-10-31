import { useState } from 'react'
import { Group } from './RenderSettings'

// Furthest the house can slide, as a fraction of the screen width
const MAX_SHIFT = 0.35

// Gear button, top-left, opening the display options: neighbouring buildings shown or not,
// where the house sits on screen (to keep it clear of the side column), the clock, and lite mode.
export default function DisplaySettings({
  showNeighbors, onShowNeighborsChange, viewShift, onViewShiftChange, lite, onLiteChange, showClock, onShowClockChange,
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="display-settings">
      <button
        className="chip display-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Réglages de l’affichage"
        title="Réglages de l’affichage"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      {open && (
        <div className="display-panel render-settings">
          <strong className="display-title">Affichage</strong>
          <Group
            title="Autres bâtiments"
            value={showNeighbors}
            onChange={onShowNeighborsChange}
            options={[
              { value: true, label: 'Afficher' },
              { value: false, label: 'Masquer' },
            ]}
          />
          <fieldset className="render-group">
            <legend>Position du plan</legend>
            <div className="view-shift">
              <input
                type="range"
                min={-MAX_SHIFT}
                max={MAX_SHIFT}
                step={0.01}
                value={viewShift}
                onChange={(e) => onViewShiftChange(Number(e.target.value))}
                aria-label="Position du plan, de gauche à droite"
              />
              <button onClick={() => onViewShiftChange(0)} disabled={viewShift === 0}>Centrer</button>
            </div>
          </fieldset>
          <Group
            title="Horloge"
            value={showClock}
            onChange={onShowClockChange}
            options={[
              { value: true, label: 'Afficher' },
              { value: false, label: 'Masquer' },
            ]}
          />
          <Group
            title="Mode Lite (TV, appareils moins performant)"
            value={lite}
            onChange={onLiteChange}
            options={[
              { value: true, label: 'Activé' },
              { value: false, label: 'Désactivé' },
            ]}
          />
        </div>
      )}
    </div>
  )
}
