import { isCategoryId, type CategoryId } from './categories'

export type Mode = 'plan' | 'shop'

export interface Line {
  id: string
  /** Exactly what was typed, quantity and all. Parsed when shown in the shop view. */
  text: string
}

export interface ListState {
  mode: Mode
  lines: Line[]
  /** Ids of lines ticked off in the shop. */
  checked: string[]
  /** Item names from past lists, most recent first, used for suggestions. */
  history: string[]
  /** Section choices made in the shop view, keyed by the item's normalised singular name. */
  overrides: Record<string, CategoryId>
}

const KEY = 'shopping-list:v1'
export const HISTORY_LIMIT = 300

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function emptyLine(): Line {
  return { id: newId(), text: '' }
}

export function initialState(): ListState {
  return { mode: 'plan', lines: [emptyLine()], checked: [], history: [], overrides: {} }
}

function isLine(value: unknown): value is Line {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Line).id === 'string' &&
    typeof (value as Line).text === 'string'
  )
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

/** Anything that does not look like a saved list is ignored rather than crashing the app. */
function fromStored(value: unknown): ListState | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Partial<Record<keyof ListState, unknown>>
  if (!Array.isArray(v.lines) || !v.lines.every(isLine)) return null
  const lines = v.lines.length > 0 ? v.lines : [emptyLine()]
  const overrides: Record<string, CategoryId> = {}
  if (typeof v.overrides === 'object' && v.overrides !== null) {
    for (const [name, category] of Object.entries(v.overrides)) {
      if (isCategoryId(category)) overrides[name] = category
    }
  }
  return {
    mode: v.mode === 'shop' ? 'shop' : 'plan',
    lines,
    checked: isStringArray(v.checked) ? v.checked : [],
    history: isStringArray(v.history) ? v.history.slice(0, HISTORY_LIMIT) : [],
    overrides,
  }
}

export function loadState(): ListState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return initialState()
    return fromStored(JSON.parse(raw)) ?? initialState()
  } catch {
    return initialState()
  }
}

export function saveState(state: ListState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage can be full or unavailable (private browsing); the list still works for the session.
  }
}
