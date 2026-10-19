import { CATALOG } from './catalog'
import { CATEGORY_IDS } from './categories'
import { normalise } from './categorise'

/** How a suggestion is shown; catalog names are stored lower case and shown with a capital. */
function display(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const catalogNames: string[] = []
for (const id of CATEGORY_IDS) {
  if (id === 'other') continue
  for (const name of CATALOG[id]) catalogNames.push(name)
}
catalogNames.sort()

export const MAX_SUGGESTIONS = 8

/**
 * Items worth offering while a name is being typed.
 * Things the person has bought before come first, then the catalog. Within each, a name that
 * starts with the typed text beats one where a later word starts with it, which beats one
 * that merely contains it, and names with fewer words come first. Nothing is suggested until at least one character is typed, and
 * the exact text already typed is not offered back.
 */
export function suggest(
  typed: string,
  history: readonly string[],
  limit = MAX_SUGGESTIONS,
): string[] {
  const query = normalise(typed)
  if (query === '') return []

  const seen = new Set<string>([query])
  const tiers: string[][] = [[], [], [], [], [], []]
  const consider = (name: string, source: 0 | 1) => {
    const key = normalise(name)
    if (seen.has(key)) return
    let rank: number
    if (key.startsWith(query)) rank = 0
    else if (key.includes(` ${query}`)) rank = 1
    else if (key.includes(query)) rank = 2
    else return
    seen.add(key)
    tiers[source * 3 + rank].push(source === 0 ? name : display(name))
  }
  for (const name of history) consider(name, 0)
  for (const name of catalogNames) consider(name, 1)

  // Within a tier the plainer name comes first: "Chicken" before "Chicken drumstick".
  const words = (name: string) => name.split(' ').length
  for (const tier of tiers) tier.sort((a, b) => words(a) - words(b) || a.localeCompare(b))
  return tiers.flat().slice(0, limit)
}
