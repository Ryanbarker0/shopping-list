/** Shop sections, in the order a typical UK supermarket is walked. Each has a colour in index.css. */
export const CATEGORIES = [
  { id: 'fruit-veg', label: 'Fruit & Veg', emoji: '🥦' },
  { id: 'bakery', label: 'Bakery', emoji: '🥖' },
  { id: 'meat-fish', label: 'Meat & Fish', emoji: '🥩' },
  { id: 'dairy-eggs', label: 'Dairy & Eggs', emoji: '🥛' },
  { id: 'chilled', label: 'Chilled & Deli', emoji: '🧀' },
  { id: 'pantry', label: 'Pantry', emoji: '🥫' },
  { id: 'snacks', label: 'Snacks & Sweets', emoji: '🍫' },
  { id: 'drinks', label: 'Drinks', emoji: '🥤' },
  { id: 'frozen', label: 'Frozen', emoji: '🧊' },
  { id: 'household', label: 'Household', emoji: '🧽' },
  { id: 'health', label: 'Health & Beauty', emoji: '🧴' },
  { id: 'baby-pet', label: 'Baby & Pet', emoji: '🐾' },
  { id: 'other', label: 'Other', emoji: '🛒' },
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
