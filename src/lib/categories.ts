/** Shop sections, in the order a typical UK supermarket is walked. */
export const CATEGORIES = [
  { id: 'fruit-veg', label: 'Fruit & Veg' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'meat-fish', label: 'Meat & Fish' },
  { id: 'dairy-eggs', label: 'Dairy & Eggs' },
  { id: 'chilled', label: 'Chilled & Deli' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'snacks', label: 'Snacks & Sweets' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'household', label: 'Household' },
  { id: 'health', label: 'Health & Beauty' },
  { id: 'baby-pet', label: 'Baby & Pet' },
  { id: 'other', label: 'Other' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((c) => c.id)

const labels = new Map<string, string>(CATEGORIES.map((c) => [c.id, c.label]))

export function categoryLabel(id: CategoryId): string {
  return labels.get(id) ?? id
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && labels.has(value)
}
