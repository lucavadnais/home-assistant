import { useEffect, useRef, useState } from 'react'

// Chip that opens a menu of options. `options`: [{ value, label, detail? }]; the option whose
// value equals `value` is highlighted. Closes on pick or on a click outside.
export default function ChipMenu({ title, subtitle, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const root = useRef()

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!root.current.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const pick = (v) => { onChange(v); setOpen(false) }

  return (
    <div className="menu-anchor" ref={root}>
      <button className="chip" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </button>
      {open && (
        <ul className="menu" role="menu">
          {options.map((o) => (
            <li key={o.value}>
              <button className={value === o.value ? 'active' : ''} onClick={() => pick(o.value)}>
                {o.label}
                {o.detail && <small>{o.detail}</small>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
