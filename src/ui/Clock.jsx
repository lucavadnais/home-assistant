import { useEffect, useState } from 'react'

const dateFormat = new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })

const dateLabel = (d) => {
  const s = dateFormat.format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const timeLabel = (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`

function useMinute() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setTimeout(() => setNow(new Date()), 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()))
    return () => clearTimeout(id)
  }, [now])
  return now
}

export default function Clock() {
  const now = useMinute()
  return (
    <div className="clock">
      <time className="clock-time" dateTime={now.toISOString()}>{timeLabel(now)}</time>
      <span className="clock-date">{dateLabel(now)}</span>
    </div>
  )
}
