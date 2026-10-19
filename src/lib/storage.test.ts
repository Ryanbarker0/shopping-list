import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, loadState, saveState } from './storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('starts with one empty line in plan mode', () => {
    const state = loadState()
    expect(state.mode).toBe('plan')
    expect(state.lines).toHaveLength(1)
    expect(state.lines[0].text).toBe('')
  })

  it('round-trips a saved list', () => {
    const state = {
      ...initialState(),
      mode: 'shop' as const,
      lines: [{ id: 'a', text: 'milk' }],
      checked: ['a'],
      history: ['milk'],
      overrides: { 'oat milk': 'drinks' as const },
    }
    saveState(state)
    expect(loadState()).toEqual(state)
  })

  it('falls back to a fresh list when the saved value is not a list', () => {
    localStorage.setItem('shopping-list:v1', 'not json')
    expect(loadState().mode).toBe('plan')
    localStorage.setItem('shopping-list:v1', JSON.stringify({ lines: 'nope' }))
    expect(loadState().lines).toHaveLength(1)
  })

  it('drops overrides that name a section that no longer exists', () => {
    saveState({ ...initialState(), overrides: { milk: 'nowhere' as never } })
    expect(loadState().overrides).toEqual({})
  })
})
