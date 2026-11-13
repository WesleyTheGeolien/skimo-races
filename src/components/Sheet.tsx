import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  /** Accessible name of the sheet. */
  label: string
  /** Dim and block the page behind the sheet (filters); off for race details so the map stays usable. */
  modal?: boolean
  className?: string
  footer?: ReactNode
  /** Scroll back to the top whenever this changes. */
  scrollKey?: unknown
  children: ReactNode
}

/** Drag the handle (or the header) down past this many pixels to close. */
const CLOSE_DISTANCE = 80

/** Phone bottom sheet: slides up, closes on swipe down, Escape or a tap on the backdrop. */
export function Sheet({ open, onClose, label, modal = false, className = '', footer, scrollKey, children }: Props) {
  const [drag, setDrag] = useState(0)
  const start = useRef<number | null>(null)
  const body = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // New content (another race picked) starts at the top.
  useEffect(() => {
    body.current?.scrollTo({ top: 0 })
  }, [scrollKey])

  const grab = {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = e.clientY
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (start.current != null) setDrag(Math.max(0, e.clientY - start.current))
    },
    onPointerUp: () => {
      if (drag > CLOSE_DISTANCE) onClose()
      start.current = null
      setDrag(0)
    },
    onPointerCancel: () => {
      start.current = null
      setDrag(0)
    },
  }

  return (
    <>
      {modal && <div className={`sheet-backdrop ${open ? 'open' : ''}`} onClick={onClose} aria-hidden />}
      <div
        className={`sheet ${open ? 'open' : ''} ${drag ? 'dragging' : ''} ${className}`}
        role={modal ? 'dialog' : 'region'}
        aria-modal={modal || undefined}
        aria-label={label}
        aria-hidden={!open}
        inert={!open}
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
      >
        <div className="sheet-grab" {...grab}>
          <span className="sheet-handle" />
        </div>
        <div className="sheet-body" ref={body}>
          {children}
        </div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </>
  )
}
