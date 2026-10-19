import { describe, expect, it } from 'vitest'
import { MAX_SUGGESTIONS, suggest } from './suggest'

describe('suggest', () => {
  it('offers nothing for an empty line', () => {
    expect(suggest('', [])).toEqual([])
    expect(suggest('   ', ['Milk'])).toEqual([])
  })

  it('ranks names starting with the text above names containing it', () => {
    const results = suggest('chick', [])
    expect(results[0]).toBe('Chicken')
    expect(results).toContain('Chicken')
    expect(results).toContain('Chicken breast')
    expect(results.length).toBeLessThanOrEqual(MAX_SUGGESTIONS)
  })

  it('offers a word-start match before an inside match', () => {
    const results = suggest('mil', [], 100)
    expect(results[0]).toBe('Milk')
    expect(results.indexOf('Oat milk')).toBeLessThan(results.indexOf('Buttermilk'))
    expect(results.indexOf('Milkshake')).toBeLessThan(results.indexOf('Oat milk'))
  })

  it('puts things bought before ahead of the catalog and keeps their spelling', () => {
    expect(suggest('ch', ['Cherry bakewells', 'Milk'])[0]).toBe('Cherry bakewells')
  })

  it('does not offer back exactly what was typed', () => {
    expect(suggest('milk', ['Milk'])).not.toContain('Milk')
    expect(suggest('Milk', [])).not.toContain('Milk')
  })

  it('ignores case and punctuation in the typed text', () => {
    expect(suggest('SEMI-SKIMMED', [])).toContain('Semi skimmed milk')
  })
})
