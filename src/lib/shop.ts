import { categorise, type CategoryOverrides } from './categorise'
import { CATEGORIES, type CategoryId } from './categories'
import { parseLine, type Quantity } from './parseLine'
import type { Line } from './storage'

export interface ShopItem {
  id: string
  name: string
  quantity: Quantity
  checked: boolean
}

export interface ShopGroup {
  category: CategoryId
  label: string
  emoji: string
  items: ShopItem[]
}

/** Lines with something typed on them, parsed. Blank lines are left out. */
export function itemsFrom(lines: readonly Line[], checked: readonly string[]): ShopItem[] {
  const ticked = new Set(checked)
  const items: ShopItem[] = []
  for (const line of lines) {
    const { name, quantity } = parseLine(line.text)
    if (name === '') continue
    items.push({ id: line.id, name, quantity, checked: ticked.has(line.id) })
  }
  return items
}

/** Items grouped by shop section in walking order; sections with nothing in them are left out. */
export function groupItems(items: readonly ShopItem[], overrides: CategoryOverrides): ShopGroup[] {
  const byCategory = new Map<CategoryId, ShopItem[]>()
  for (const item of items) {
    const category = categorise(item.name, overrides)
    const group = byCategory.get(category)
    if (group) group.push(item)
    else byCategory.set(category, [item])
  }
  return CATEGORIES.flatMap(({ id, label, emoji }) => {
    const items = byCategory.get(id)
    return items ? [{ category: id, label, emoji, items }] : []
  })
}
