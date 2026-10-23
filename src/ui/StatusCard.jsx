import { HA_URL } from '../ha/useHomeAssistant'

// What each non-connected status means and what to do about it. `retry`: offer a reconnect button.
const DETAILS = {
  demo: {
    title: 'Mode démo',
    text: 'Aucune connexion à Home Assistant n’est configurée : les appareils ne reflètent pas la réalité.',
    hint: 'Renseigne VITE_HA_URL et VITE_HA_TOKEN dans .env.local, puis relance l’app.',
  },
  connecting: {
    title: 'Connexion en cours…',
    text: `Connexion à Home Assistant (${HA_URL}).`,
  },
  disconnected: {
    title: 'Connexion perdue',
    text: 'La connexion à Home Assistant a été coupée. Reconnexion automatique en cours.',
    hint: 'Si ça dure, vérifie que le Raspberry Pi est allumé et connecté au réseau.',
  },
  'auth-error': {
    title: 'Jeton refusé',
    text: 'Home Assistant a refusé le jeton d’accès (expiré ou supprimé).',
    hint: 'Crée un nouveau jeton longue durée dans ton profil Home Assistant, colle-le dans .env.local, puis relance l’app.',
    retry: true,
  },
  error: {
    title: 'Home Assistant injoignable',
    text: `Impossible de joindre ${HA_URL}.`,
    hint: 'Vérifie que le Raspberry Pi est allumé et que le conteneur tourne : sudo docker start homeassistant.',
    retry: true,
  },
}

// Explains the connection status at the top of the device list when the app isn't connected.
export default function StatusCard({ status, onRetry }) {
  const d = DETAILS[status]
  if (!d) return null
  return (
    <div className={`status-card status-${status}`} role="alert">
      <div className="status-card-title">
        <span className={`status-dot status-${status}`} aria-hidden="true" />
        <strong>{d.title}</strong>
      </div>
      <p>{d.text}</p>
      {d.hint && <p className="status-card-hint">{d.hint}</p>}
      {d.retry && <button className="status-card-retry" onClick={onRetry}>Réessayer</button>}
    </div>
  )
}
