import { describe, expect, it } from 'vitest'
import { initialState, type ListState } from '../lib/storage'
import { reduce } from './useShoppingList'

function planned(texts: string[]): ListState {
  return { ...initialState(), lines: texts.map((text, i) => ({ id: `l${i}`, text })) }
}

describe('reduce', () => {
  it('inserts a line after another and keeps order', () => {
    const state = reduce(planned(['a', 'c']), {
      type: 'insertAfter',
      id: 'l0',
      line: { id: 'new', text: 'b' },
    })
    expect(state.lines.map((l) => l.text)).toEqual(['a', 'b', 'c'])
  })

  it('splits a pasted block over several lines', () => {
    const state = reduce(planned(['x', 'z']), {
      type: 'replaceWithMany',
      id: 'l0',
      lines: [
        { id: 'l0', text: 'milk' },
        { id: 'p1', text: 'eggs' },
      ],
    })
    expect(state.lines.map((l) => l.text)).toEqual(['milk', 'eggs', 'z'])
  })

  it('never leaves the plan without a line', () => {
    const state = reduce(planned(['only']), { type: 'remove', id: 'l0' })
    expect(state.lines).toHaveLength(1)
    expect(state.lines[0].text).toBe('')
    expect(state.lines[0].id).not.toBe('l0')
  })

  it('starts the shop with blank lines dropped and names remembered', () => {
    const state = reduce(planned(['milk 2l', '', 'Eggs x6', '  ']), { type: 'startShop' })
    expect(state.mode).toBe('shop')
    expect(state.lines.map((l) => l.text)).toEqual(['milk 2l', 'Eggs x6'])
    expect(state.history).toEqual(['milk', 'Eggs'])
  })

  it('does nothing when asked to shop an empty list', () => {
    const state = planned(['', ' '])
    expect(reduce(state, { type: 'startShop' })).toBe(state)
  })

  it('keeps the most recent spelling at the front of history without repeats', () => {
    let state = reduce(planned(['milk', 'bread']), { type: 'startShop' })
    state = reduce(state, { type: 'cleanUp' })
    state = reduce({ ...state, lines: [{ id: 'n', text: 'Milk x2' }] }, { type: 'startShop' })
    expect(state.history).toEqual(['Milk', 'bread'])
  })

  it('toggles items and keeps the ticks when going back to edit', () => {
    let state = reduce(planned(['milk', 'bread']), { type: 'startShop' })
    state = reduce(state, { type: 'toggle', id: 'l0' })
    expect(state.checked).toEqual(['l0'])
    state = reduce(state, { type: 'backToPlan' })
    expect(state.mode).toBe('plan')
    expect(state.checked).toEqual(['l0'])
    expect(state.lines[state.lines.length - 1].text).toBe('')
    state = reduce(state, { type: 'toggle', id: 'l0' })
    expect(state.checked).toEqual([])
  })

  it('remembers a section choice by item name', () => {
    const state = reduce(initialState(), {
      type: 'setCategory',
      name: 'Oat Milks',
      category: 'drinks',
    })
    expect(state.overrides).toEqual({ 'oat milk': 'drinks' })
  })

  it('cleans up to a blank plan but keeps history and overrides', () => {
    let state = reduce(planned(['milk']), { type: 'startShop' })
    state = reduce(state, { type: 'setCategory', name: 'milk', category: 'drinks' })
    state = reduce(state, { type: 'cleanUp' })
    expect(state.mode).toBe('plan')
    expect(state.lines).toHaveLength(1)
    expect(state.lines[0].text).toBe('')
    expect(state.checked).toEqual([])
    expect(state.history).toEqual(['milk'])
    expect(state.overrides).toEqual({ milk: 'drinks' })
  })
})
