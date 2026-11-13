import type { ReactNode } from 'react'

/**
 * The skimo climber (skis on the back, boot-packing up a ~49° slope), used for the header and empty states.
 * Same drawing as public/favicon.svg: keep the two in sync.
 */
interface Props {
  size?: number
  /** `badge`: rounded navy tile, as in the favicon. `scene`: the climber on a slope, no tile. */
  variant?: 'badge' | 'scene'
  className?: string
}

const BODY = ['M25 24 L19 38', 'M19 38 L17 45 L15 51', 'M19 38 L25 31 L26 38', 'M25 25 L32 23']
const SKIS = [
  [10, 40, 17, 8],
  [14, 41, 22, 10],
]
const POLE = [32, 23, 35, 28]
/** Snow inside the rounded tile: the slope line meets the tile's top-right and bottom-left corner arcs. */
const SNOW_BADGE = 'M5.7 61.4 L57.2 2.2 A14 14 0 0 1 64 14 L64 50 A14 14 0 0 1 50 64 L14 64 A14 14 0 0 1 5.7 61.4 Z'
const SNOW_SCENE = 'M3.5 64 L59 0 L64 0 L64 64 Z'

export function Logo({ size = 32, variant = 'badge', className }: Props) {
  const badge = variant === 'badge'
  // On the badge the climber is white on navy; in the scene it is navy on the page background.
  const ink = badge ? '#fff' : 'var(--brand)'
  const halo = badge ? 'var(--brand)' : 'var(--panel)'
  const body = (stroke: string, width: number) => (
    <g stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {BODY.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  )
  const skis = (stroke: string, width: number) => (
    <g stroke={stroke} strokeWidth={width} strokeLinecap="round">
      {SKIS.map(([x1, y1, x2, y2]) => (
        <line key={x1} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </g>
  )
  const [px1, py1, px2, py2] = POLE
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {badge && <rect width="64" height="64" rx="14" fill="var(--brand)" />}
      <path d={badge ? SNOW_BADGE : SNOW_SCENE} fill={badge ? 'var(--snow)' : 'var(--accent-soft)'} />
      {skis(halo, 6)}
      {skis('var(--ski)', 3)}
      <line x1={px1} y1={py1} x2={px2} y2={py2} stroke={halo} strokeWidth={4} strokeLinecap="round" />
      <line x1={px1} y1={py1} x2={px2} y2={py2} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {body(halo, 7)}
      {body(ink, 4)}
      <circle cx="29" cy="17" r="6.5" fill={halo} />
      <circle cx="29" cy="17" r="5" fill={ink} />
    </svg>
  )
}

/** Empty state with the climber, for views with nothing to show. */
export function EmptyState({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <div className={small ? 'empty-state small' : 'empty-state'}>
      <Logo variant="scene" size={small ? 44 : 88} />
      <p>{children}</p>
    </div>
  )
}
