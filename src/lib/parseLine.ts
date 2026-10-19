/**
 * A typed line such as "onions x3", "chicken breasts 400g" or "2 x 400g chopped tomatoes"
 * is split into the item's name and whatever quantity was written alongside it.
 * The quantity is optional and can be a count, a measure, or both.
 */

export interface Measure {
  value: number
  /** Canonical unit: a symbol for weights and volumes (g, kg, ml, l) or a singular word (tin, pack). */
  unit: string
}

export interface Quantity {
  count?: number
  measure?: Measure
}

export interface ParsedLine {
  /** The item with any quantity removed and whitespace tidied. Empty when the line has no item. */
  name: string
  quantity: Quantity
}

/** Spellings people type, mapped to the canonical unit. Longer spellings must be listed first. */
const UNIT_ALIASES: Array<[string, string]> = [
  ['kilograms', 'kg'],
  ['kilogram', 'kg'],
  ['kilos', 'kg'],
  ['kilo', 'kg'],
  ['kgs', 'kg'],
  ['kg', 'kg'],
  ['grams', 'g'],
  ['gram', 'g'],
  ['gr', 'g'],
  ['g', 'g'],
  ['millilitres', 'ml'],
  ['milliliters', 'ml'],
  ['ml', 'ml'],
  ['litres', 'l'],
  ['liters', 'l'],
  ['litre', 'l'],
  ['liter', 'l'],
  ['ltr', 'l'],
  ['l', 'l'],
  ['pounds', 'lb'],
  ['pound', 'lb'],
  ['lbs', 'lb'],
  ['lb', 'lb'],
  ['ounces', 'oz'],
  ['ounce', 'oz'],
  ['oz', 'oz'],
  ['pints', 'pint'],
  ['pint', 'pint'],
  ['pt', 'pint'],
  ['packs', 'pack'],
  ['pack', 'pack'],
  ['packets', 'packet'],
  ['packet', 'packet'],
  ['pk', 'pack'],
  ['tins', 'tin'],
  ['tin', 'tin'],
  ['cans', 'can'],
  ['can', 'can'],
  ['jars', 'jar'],
  ['jar', 'jar'],
  ['bottles', 'bottle'],
  ['bottle', 'bottle'],
  ['bags', 'bag'],
  ['bag', 'bag'],
  ['boxes', 'box'],
  ['box', 'box'],
  ['punnets', 'punnet'],
  ['punnet', 'punnet'],
  ['bunches', 'bunch'],
  ['bunch', 'bunch'],
  ['loaves', 'loaf'],
  ['loaf', 'loaf'],
  ['dozen', 'dozen'],
  ['slices', 'slice'],
  ['slice', 'slice'],
  ['cartons', 'carton'],
  ['carton', 'carton'],
  ['tubs', 'tub'],
  ['tub', 'tub'],
  ['rolls', 'roll'],
  ['roll', 'roll'],
  ['heads', 'head'],
  ['head', 'head'],
]

const unitByAlias = new Map(UNIT_ALIASES)
/** Units written as symbols sit flush against the number (400g, 2l); word units are shown with a space (2 tins). */
const SYMBOL_UNITS = new Set(['g', 'kg', 'ml', 'l', 'lb', 'oz'])

const NUMBER = String.raw`\d+(?:[.,]\d+)?`
const UNIT = UNIT_ALIASES.map(([alias]) => alias).join('|')
/** "400g", "1.5 kg", "2 tins", "6 pack". Word units need a space; symbols may be flush. */
const MEASURE = String.raw`(${NUMBER})\s*(${UNIT})\b`
/** "x3", "x 3", "3x", "3 x", "×3", "*3". */
const COUNT_AFTER = String.raw`[x×*]\s*(\d+)`
const COUNT_BEFORE = String.raw`(\d+)\s*[x×*]`

const LEADING_MEASURE = new RegExp(String.raw`^${MEASURE}(?:\s+of)?(?=\s|$)`, 'i')
const TRAILING_MEASURE = new RegExp(String.raw`(?:^|\s)${MEASURE}$`, 'i')
const LEADING_COUNT = new RegExp(String.raw`^(?:${COUNT_AFTER}|${COUNT_BEFORE})(?=\s|$)`, 'i')
const TRAILING_COUNT = new RegExp(String.raw`(?:^|\s)(?:${COUNT_AFTER}|${COUNT_BEFORE})$`, 'i')
const LEADING_BARE_NUMBER = new RegExp(String.raw`^(\d+)(?:\s+x)?\s+(?=\S)`, 'i')
const TRAILING_BARE_NUMBER = /\s(\d+)$/

function parseNumber(text: string): number {
  return Number(text.replace(',', '.'))
}

function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function parseLine(raw: string): ParsedLine {
  let text = tidy(raw)
  const quantity: Quantity = {}

  // Measures and explicit counts can appear at either end, in any order: "2 x 400g tomatoes".
  // Each pass strips at most one of each, outermost first, until nothing more matches.
  let changed = true
  while (changed && text !== '') {
    changed = false
    const trailingMeasure = quantity.measure === undefined ? TRAILING_MEASURE.exec(text) : null
    if (trailingMeasure) {
      quantity.measure = toMeasure(trailingMeasure[1], trailingMeasure[2])
      text = tidy(text.slice(0, trailingMeasure.index))
      changed = true
    }
    const leadingMeasure = quantity.measure === undefined ? LEADING_MEASURE.exec(text) : null
    if (leadingMeasure) {
      quantity.measure = toMeasure(leadingMeasure[1], leadingMeasure[2])
      text = tidy(text.slice(leadingMeasure[0].length))
      changed = true
    }
    const trailingCount = quantity.count === undefined ? TRAILING_COUNT.exec(text) : null
    if (trailingCount) {
      quantity.count = Number(trailingCount[1] ?? trailingCount[2])
      text = tidy(text.slice(0, trailingCount.index))
      changed = true
    }
    const leadingCount = quantity.count === undefined ? LEADING_COUNT.exec(text) : null
    if (leadingCount) {
      quantity.count = Number(leadingCount[1] ?? leadingCount[2])
      text = tidy(text.slice(leadingCount[0].length))
      changed = true
    }
  }

  // A bare number only counts when something else is on the line: "3 onions", "onions 3".
  if (quantity.count === undefined) {
    const leading = LEADING_BARE_NUMBER.exec(text)
    if (leading) {
      quantity.count = Number(leading[1])
      text = tidy(text.slice(leading[0].length))
    } else {
      const trailing = TRAILING_BARE_NUMBER.exec(text)
      if (trailing) {
        quantity.count = Number(trailing[1])
        text = tidy(text.slice(0, trailing.index))
      }
    }
  }

  text = text.replace(/^of\s+/i, '')
  return { name: text, quantity }
}

function toMeasure(value: string, unit: string): Measure {
  return { value: parseNumber(value), unit: unitByAlias.get(unit.toLowerCase()) ?? unit }
}

export function hasQuantity(quantity: Quantity): boolean {
  return quantity.count !== undefined || quantity.measure !== undefined
}

function formatMeasure({ value, unit }: Measure): string {
  if (SYMBOL_UNITS.has(unit)) return `${value}${unit}`
  const plural = value === 1 || unit === 'dozen' ? unit : unit === 'loaf' ? 'loaves' : `${unit}s`
  return `${value} ${plural}`
}

/** The quantity as it is shown on the shop list: "×3", "400g", "2 × 400g", "6 pack". */
export function formatQuantity(quantity: Quantity): string {
  const parts: string[] = []
  if (quantity.count !== undefined && quantity.measure !== undefined) {
    parts.push(`${quantity.count} ×`, formatMeasure(quantity.measure))
  } else if (quantity.count !== undefined) {
    parts.push(`×${quantity.count}`)
  } else if (quantity.measure !== undefined) {
    parts.push(formatMeasure(quantity.measure))
  }
  return parts.join(' ')
}

/** The quantity in the plain form a person would type after an item: "x3", "400g", "2 x 400g". */
export function quantityAsTyped(quantity: Quantity): string {
  const parts: string[] = []
  if (quantity.count !== undefined && quantity.measure !== undefined) {
    parts.push(`${quantity.count} x`, formatMeasure(quantity.measure))
  } else if (quantity.count !== undefined) {
    parts.push(`x${quantity.count}`)
  } else if (quantity.measure !== undefined) {
    parts.push(formatMeasure(quantity.measure))
  }
  return parts.join(' ')
}
