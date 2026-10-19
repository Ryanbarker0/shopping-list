import { describe, expect, it } from 'vitest'
import { formatQuantity, parseLine, quantityAsTyped } from './parseLine'

describe('parseLine', () => {
  it('returns the text as the name when there is no quantity', () => {
    expect(parseLine('  Chicken   breasts ')).toEqual({ name: 'Chicken breasts', quantity: {} })
    expect(parseLine('')).toEqual({ name: '', quantity: {} })
  })

  it.each([
    ['onions x3', 'onions', 3],
    ['onions x 3', 'onions', 3],
    ['onions 3x', 'onions', 3],
    ['onions ×3', 'onions', 3],
    ['3x onions', 'onions', 3],
    ['x3 onions', 'onions', 3],
    ['3 x onions', 'onions', 3],
    ['3 onions', 'onions', 3],
    ['onions 3', 'onions', 3],
    ['12 eggs', 'eggs', 12],
  ])('reads a count from "%s"', (line, name, count) => {
    expect(parseLine(line)).toEqual({ name, quantity: { count } })
  })

  it.each([
    ['chicken breasts 400g', 'chicken breasts', 400, 'g'],
    ['chicken breasts 400 g', 'chicken breasts', 400, 'g'],
    ['1kg turkey mince', 'turkey mince', 1, 'kg'],
    ['1.5kg potatoes', 'potatoes', 1.5, 'kg'],
    ['1,5 kg potatoes', 'potatoes', 1.5, 'kg'],
    ['2 litres milk', 'milk', 2, 'l'],
    ['milk 2l', 'milk', 2, 'l'],
    ['500ml double cream', 'double cream', 500, 'ml'],
    ['2 tins chopped tomatoes', 'chopped tomatoes', 2, 'tin'],
    ['chopped tomatoes 2 tins', 'chopped tomatoes', 2, 'tin'],
    ['6 pack eggs', 'eggs', 6, 'pack'],
    ['1 loaf bread', 'bread', 1, 'loaf'],
    ['2 loaves bread', 'bread', 2, 'loaf'],
    ['a bunch of bananas 1 bunch', 'a bunch of bananas', 1, 'bunch'],
    ['1lb mince', 'mince', 1, 'lb'],
  ])('reads a measure from "%s"', (line, name, value, unit) => {
    expect(parseLine(line)).toEqual({ name, quantity: { measure: { value, unit } } })
  })

  it('drops the "of" between a leading measure and the item', () => {
    expect(parseLine('1kg of turkey mince').name).toBe('turkey mince')
    expect(parseLine('2 tins of tomatoes').name).toBe('tomatoes')
  })

  it('reads a count and a measure together in either order', () => {
    expect(parseLine('2 x 400g chopped tomatoes')).toEqual({
      name: 'chopped tomatoes',
      quantity: { count: 2, measure: { value: 400, unit: 'g' } },
    })
    expect(parseLine('chopped tomatoes 400g x2')).toEqual({
      name: 'chopped tomatoes',
      quantity: { count: 2, measure: { value: 400, unit: 'g' } },
    })
    expect(parseLine('coke 2l x 4')).toEqual({
      name: 'coke',
      quantity: { count: 4, measure: { value: 2, unit: 'l' } },
    })
  })

  it('does not mistake words that start like a unit for a unit', () => {
    expect(parseLine('3 lemons')).toEqual({ name: 'lemons', quantity: { count: 3 } })
    expect(parseLine('2 garlic')).toEqual({ name: 'garlic', quantity: { count: 2 } })
    expect(parseLine('5 limes')).toEqual({ name: 'limes', quantity: { count: 5 } })
  })

  it('leaves a number alone when it is the whole line', () => {
    expect(parseLine('3')).toEqual({ name: '3', quantity: {} })
  })

  it('keeps numbers that are part of the name', () => {
    expect(parseLine('7up')).toEqual({ name: '7up', quantity: {} })
    expect(parseLine('5 alive')).toEqual({ name: 'alive', quantity: { count: 5 } })
  })
})

describe('formatQuantity', () => {
  it('formats counts, measures and both together', () => {
    expect(formatQuantity({})).toBe('')
    expect(formatQuantity({ count: 3 })).toBe('×3')
    expect(formatQuantity({ measure: { value: 400, unit: 'g' } })).toBe('400g')
    expect(formatQuantity({ measure: { value: 1.5, unit: 'kg' } })).toBe('1.5kg')
    expect(formatQuantity({ measure: { value: 2, unit: 'tin' } })).toBe('2 tins')
    expect(formatQuantity({ measure: { value: 1, unit: 'tin' } })).toBe('1 tin')
    expect(formatQuantity({ measure: { value: 2, unit: 'loaf' } })).toBe('2 loaves')
    expect(formatQuantity({ measure: { value: 1, unit: 'dozen' } })).toBe('1 dozen')
    expect(formatQuantity({ count: 2, measure: { value: 400, unit: 'g' } })).toBe('2 × 400g')
  })
})

describe('quantityAsTyped', () => {
  it('round-trips through parseLine', () => {
    for (const typed of ['x3', '400g', '2 x 400g', '2 tins', '1.5kg']) {
      const { quantity } = parseLine(`thing ${typed}`)
      expect(quantityAsTyped(quantity)).toBe(typed)
      expect(parseLine(`thing ${quantityAsTyped(quantity)}`).quantity).toEqual(quantity)
    }
  })
})
