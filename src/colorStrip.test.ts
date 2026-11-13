import { describe, expect, it } from 'vitest'
import { nextColorBy } from './components/ColorKey'

describe('nextColorBy', () => {
  it('steps through every mode and wraps around', () => {
    expect(nextColorBy('level')).toBe('format')
    expect(nextColorBy('format')).toBe('month')
    expect(nextColorBy('month')).toBe('level')
  })
})
