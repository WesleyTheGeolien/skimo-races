import type { Race, Selection } from './types'

const PARAM = 'race'

/** The race named in a URL's `?race=` parameter, if it exists. */
export function selectionFromUrl(href: string, races: Race[]): Selection {
  const id = new URL(href).searchParams.get(PARAM)
  return id && races.some((r) => r.id === id) ? { kind: 'race', id } : null
}

/** `href` with `?race=` set to the selected race, or removed when no single race is selected. */
export function urlForSelection(href: string, selection: Selection): string {
  const url = new URL(href)
  if (selection?.kind === 'race') url.searchParams.set(PARAM, selection.id)
  else url.searchParams.delete(PARAM)
  return url.toString()
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/** Share a link to `race` with the system share sheet, or copy it when there is none. */
export async function shareRace(race: Race, href = window.location.href): Promise<ShareResult> {
  const url = urlForSelection(href, { kind: 'race', id: race.id })
  if (navigator.share) {
    try {
      // URL only: given `text` as well, iOS share targets (Messages, Copy, Notes…) often keep the text and drop the link.
      await navigator.share({ title: race.name, url })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // Share sheet unavailable here (e.g. not allowed): fall back to copying.
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
