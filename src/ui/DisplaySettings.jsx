import { useState } from 'react'
import { Group } from './RenderSettings'
import { typeLabel } from '../ha/devices'

// Furthest the house can slide, as a fraction of the screen width
const MAX_SHIFT = 0.35

// Gear button, top-left, opening the display options: neighbouring buildings shown or not,
// where the house sits on screen (to keep it clear of the side column), lite mode,
// which types of Home Assistant device are shown (lights, sockets, speakers…), and how to get
// one's own house in place of the author's.
export default function DisplaySettings({
  showNeighbors, onShowNeighborsChange, viewShift, onViewShiftChange, lite, onLiteChange,
  availableTypes, shownTypes, onShownTypesChange,
}) {
  const toggleType = (id) =>
    onShownTypesChange(shownTypes.includes(id) ? shownTypes.filter((t) => t !== id) : [...shownTypes, id])
  // The types Home Assistant has, plus any ticked one it hasn't (yet) so it can still be unticked
  const offered = [...availableTypes, ...shownTypes.filter((t) => !availableTypes.includes(t))]
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
          <section className="display-help">
            <strong>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-5M12 8h.01" />
              </svg>
              Votre maison
            </strong>
            <p>
              Pour modéliser votre maison à partir de photos : ouvrez le projet dans Claude Code
              (app Claude, onglet Code), déposez les photos dans <code>house-photos/</code>,
              puis lancez le skill <code>/build-house</code>.
            </p>
          </section>
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
            title="Mode Lite (TV, appareils moins performant)"
            value={lite}
            onChange={onLiteChange}
            options={[
              { value: true, label: 'Activé' },
              { value: false, label: 'Désactivé' },
            ]}
          />
          {offered.length > 0 && (
            <fieldset className="render-group">
              <legend>Appareils affichés</legend>
              <div className="render-options">
                {offered.map((t) => (
                  <button
                    key={t}
                    className={shownTypes.includes(t) ? 'active' : ''}
                    onClick={() => toggleType(t)}
                    aria-pressed={shownTypes.includes(t)}
                  >
                    {typeLabel(t)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}
    </div>
  )
}
