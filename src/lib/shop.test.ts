import { describe, expect, it } from 'vitest'
import { groupItems, itemsFrom } from './shop'

describe('itemsFrom', () => {
  it('parses each line and skips blank ones', () => {
    const items = itemsFrom(
      [
        { id: 'a', text: 'onions x3' },
        { id: 'b', text: '   ' },
        { id: 'c', text: '1kg turkey mince' },
      ],
      ['c'],
    )
    expect(items).toEqual([
      { id: 'a', name: 'onions', quantity: { count: 3 }, checked: false },
      {
        id: 'c',
        name: 'turkey mince',
        quantity: { measure: { value: 1, unit: 'kg' } },
        checked: true,
      },
    ])
  })
})

describe('groupItems', () => {
  it('groups in shop order and keeps the typed order within a section', () => {
    const items = itemsFrom(
      [
        { id: '1', text: 'milk' },
        { id: '2', text: 'onions' },
        { id: '3', text: 'bread' },
        { id: '4', text: 'carrots' },
        { id: '5', text: 'mystery thing' },
      ],
      [],
    )
    const groups = groupItems(items, {})
    expect(groups.map((g) => g.label)).toEqual(['Fruit & Veg', 'Bakery', 'Dairy & Eggs', 'Other'])
    expect(groups[0].items.map((i) => i.name)).toEqual(['onions', 'carrots'])
  })

  it('honours overrides', () => {
    const items = itemsFrom([{ id: '1', text: 'oat milk' }], [])
    expect(groupItems(items, { 'oat milk': 'drinks' })[0].category).toBe('drinks')
  })
})
