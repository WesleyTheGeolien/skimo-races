import races from './data/races.json'
import type { Race } from './types'

/** All races, bundled at build time from scripts/raw.tsv (run `npm run data` after editing it). */
export const RACES = races as Race[]
