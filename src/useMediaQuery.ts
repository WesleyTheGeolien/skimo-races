import { useSyncExternalStore } from 'react'

/** Phone layout: map or list full screen, filters and race details in bottom sheets. */
export const MOBILE_QUERY = '(max-width: 760px)'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
