import { CATALOG, MODIFIER_CATEGORIES } from './catalog'
import { CATEGORY_IDS, type CategoryId } from './categories'

/**
 * Lower case, accents kept, apostrophes removed so "goat's" and "goats" agree, other punctuation
 * treated as a space, one space between words.
 */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^\p{L}\p{N}&\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Words that end in "s" but are not plurals, or whose plural is the usual spelling. */
const NOT_PLURAL = new Set([
  'asparagus',
  'bass',
  'brussels',
  'couscous',
  'cress',
  'floss',
  'gas',
  'glass',
  'grass',
  'hummus',
  'houmous',
  'lens',
  'molasses',
  'mousse',
  'plus',
  'swiss',
  'watercress',
  'yes',
])

/** Plurals the general rules get wrong. */
const IRREGULAR: Record<string, string> = {
  brownies: 'brownie',
  calves: 'calf',
  chilies: 'chili',
  chillies: 'chilli',
  cookies: 'cookie',
  halves: 'half',
  hoodies: 'hoodie',
  knives: 'knife',
  leaves: 'leaf',
  loaves: 'loaf',
  shelves: 'shelf',
  smoothies: 'smoothie',
  veggies: 'veggie',
}

function singular(word: string): string {
  const irregular = IRREGULAR[word]
  if (irregular) return irregular
  if (word.length <= 3 || NOT_PLURAL.has(word) || !word.endsWith('s')) return word
  if (word.endsWith('ss') || word.endsWith('us') || word.endsWith('is')) return word
  // Short words ending in "ies" are "ie" words: pies, ties. Longer ones are "y" words: cherries.
  if (word.endsWith('ies')) return word.length <= 4 ? word.slice(0, -1) : `${word.slice(0, -3)}y`
  if (/(?:ch|sh|x|z|ss|o)es$/.test(word)) return word.slice(0, -2)
  return word.slice(0, -1)
}

/** Each word of the normalised text in singular form: "chicken breasts" becomes ["chicken", "breast"]. */
export function singularWords(text: string): string[] {
  return normalise(text)
    .split(' ')
    .filter((w) => w !== '')
    .map(singular)
}

const categoryByName = new Map<string, CategoryId>()
for (const id of CATEGORY_IDS) {
  if (id === 'other') continue
  for (const name of CATALOG[id]) {
    categoryByName.set(singularWords(name).join(' '), id)
  }
}

/** Per-item choices made in the shop view, keyed by the normalised singular name. */
export type CategoryOverrides = Readonly<Record<string, CategoryId>>

/** The key under which an item's category choice is remembered. */
export function itemKey(name: string): string {
  return singularWords(name).join(' ')
}

/**
 * Decide the shop section for an item name.
 * An override made by the person wins, then a modifier word such as "frozen", then the longest
 * phrase of the name that the catalog knows. Among phrases of the same length the later one
 * wins, because in English the head noun comes last: "chocolate milk" is milk.
 */
export function categorise(name: string, overrides: CategoryOverrides = {}): CategoryId {
  const words = singularWords(name)
  if (words.length === 0) return 'other'
  const key = words.join(' ')
  const override = overrides[key]
  if (override) return override

  const exact = categoryByName.get(key)
  if (exact) return exact

  for (const word of words) {
    const modified = MODIFIER_CATEGORIES[word]
    if (modified) return modified
  }

  for (let length = words.length - 1; length >= 1; length--) {
    for (let start = words.length - length; start >= 0; start--) {
      const phrase = words.slice(start, start + length).join(' ')
      const match = categoryByName.get(phrase)
      if (match) return match
    }
  }
  return 'other'
}
