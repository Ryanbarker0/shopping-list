import { useEffect, useReducer } from 'react'
import { itemKey } from '../lib/categorise'
import type { CategoryId } from '../lib/categories'
import { parseLine } from '../lib/parseLine'
import {
  HISTORY_LIMIT,
  emptyLine,
  loadState,
  saveState,
  type Line,
  type ListState,
} from '../lib/storage'

export type Action =
  | { type: 'edit'; id: string; text: string }
  | { type: 'insertAfter'; id: string; line: Line }
  | { type: 'replaceWithMany'; id: string; lines: Line[] }
  | { type: 'remove'; id: string }
  | { type: 'clearList' }
  | { type: 'startShop' }
  | { type: 'backToPlan' }
  | { type: 'toggle'; id: string }
  | { type: 'setCategory'; name: string; category: CategoryId }
  | { type: 'cleanUp' }

function withLineAfter(lines: Line[], id: string, inserted: Line[]): Line[] {
  const at = lines.findIndex((l) => l.id === id)
  if (at === -1) return [...lines, ...inserted]
  return [...lines.slice(0, at + 1), ...inserted, ...lines.slice(at + 1)]
}

/** Names from the lines go to the front of the history, most recent first, without repeats. */
function remember(history: string[], lines: Line[]): string[] {
  const names = lines.map((l) => parseLine(l.text).name).filter((n) => n !== '')
  const seen = new Set<string>()
  const next: string[] = []
  for (const name of [...names, ...history]) {
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    next.push(name)
    if (next.length === HISTORY_LIMIT) break
  }
  return next
}

export function reduce(state: ListState, action: Action): ListState {
  switch (action.type) {
    case 'edit':
      return {
        ...state,
        lines: state.lines.map((l) => (l.id === action.id ? { ...l, text: action.text } : l)),
      }
    case 'insertAfter':
      return { ...state, lines: withLineAfter(state.lines, action.id, [action.line]) }
    case 'replaceWithMany': {
      const [first, ...rest] = action.lines
      if (!first) return state
      const lines = state.lines.map((l) => (l.id === action.id ? { ...l, text: first.text } : l))
      return { ...state, lines: withLineAfter(lines, action.id, rest) }
    }
    case 'remove': {
      const lines = state.lines.filter((l) => l.id !== action.id)
      return {
        ...state,
        lines: lines.length > 0 ? lines : [emptyLine()],
        checked: state.checked.filter((id) => id !== action.id),
      }
    }
    case 'clearList':
      return { ...state, lines: [emptyLine()], checked: [] }
    case 'startShop': {
      const lines = state.lines.filter((l) => parseLine(l.text).name !== '')
      if (lines.length === 0) return state
      const kept = new Set(lines.map((l) => l.id))
      return {
        ...state,
        mode: 'shop',
        lines,
        checked: state.checked.filter((id) => kept.has(id)),
        history: remember(state.history, lines),
      }
    }
    case 'backToPlan': {
      // Coming back to add things, so there is always a blank line to type on.
      const last = state.lines[state.lines.length - 1]
      const lines = last && last.text.trim() === '' ? state.lines : [...state.lines, emptyLine()]
      return { ...state, mode: 'plan', lines }
    }
    case 'toggle':
      return {
        ...state,
        checked: state.checked.includes(action.id)
          ? state.checked.filter((id) => id !== action.id)
          : [...state.checked, action.id],
      }
    case 'setCategory':
      return {
        ...state,
        overrides: { ...state.overrides, [itemKey(action.name)]: action.category },
      }
    case 'cleanUp':
      return { ...state, mode: 'plan', lines: [emptyLine()], checked: [] }
  }
}

export function useShoppingList() {
  const [state, dispatch] = useReducer(reduce, undefined, loadState)
  useEffect(() => saveState(state), [state])
  return { state, dispatch }
}
