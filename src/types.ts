export type Level =
  | 'International'
  | 'French Championship'
  | 'Coupe de France'
  | 'Regional'
  | 'Promo'
  | 'Classic'
  | 'Open'

export type Status = 'Confirmed' | 'Date TBC' | 'Cancelled'

export interface Race {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  status: Status
  location: string
  region: string | null
  country: string
  details: string | null
  url: string | null
  lat: number | null
  lon: number | null
  level: Level
  disciplines: string[]
  is_night: boolean
}

export type Selection = { kind: 'race'; id: string } | { kind: 'place'; key: string } | null

export const LEVELS: Level[] = [
  'Classic',
  'International',
  'French Championship',
  'Coupe de France',
  'Regional',
  'Promo',
  'Open',
]

export const LEVEL_COLORS: Record<Level, string> = {
  Classic: '#d1495b',
  International: '#7b2cbf',
  'French Championship': '#1d4ed8',
  'Coupe de France': '#0891b2',
  Regional: '#16a34a',
  Promo: '#ca8a04',
  Open: '#ea580c',
}

export const DISCIPLINES = ['Individual', 'Team', 'Vertical', 'Sprint', 'Relay']
