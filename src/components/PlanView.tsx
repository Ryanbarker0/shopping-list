import { useState, type Dispatch } from 'react'
import { parseLine } from '../lib/parseLine'
import { newId, type ListState } from '../lib/storage'
import type { Action } from '../state/useShoppingList'
import { ConfirmButton } from './ConfirmButton'
import { LineEditor } from './LineEditor'

interface Props {
  state: ListState
  dispatch: Dispatch<Action>
  /** Called instead of dispatching startShop, so the app can note where each line is first. */
  onStartShop: () => void
}

export function PlanView({ state, dispatch, onStartShop }: Props) {
  const { lines, history } = state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)

  const count = lines.filter((l) => parseLine(l.text).name !== '').length

  const focus = (id: string) => {
    setActiveId(id)
    setFocusId(id)
  }

  const onEnter = (index: number) => {
    const line = lines[index]
    if (line.text.trim() === '') return
    const next = lines[index + 1]
    if (next && next.text.trim() === '') {
      focus(next.id)
      return
    }
    const inserted = { id: newId(), text: '' }
    dispatch({ type: 'insertAfter', id: line.id, line: inserted })
    focus(inserted.id)
  }

  const onBackspaceWhenEmpty = (index: number) => {
    if (lines.length === 1) return
    const previous = lines[index - 1] ?? lines[index + 1]
    dispatch({ type: 'remove', id: lines[index].id })
    focus(previous.id)
  }

  const onPasteLines = (index: number, texts: string[]) => {
    const line = lines[index]
    const pasted = texts.map((text, i) => ({ id: i === 0 ? line.id : newId(), text }))
    dispatch({ type: 'replaceWithMany', id: line.id, lines: pasted })
    focus(pasted[pasted.length - 1].id)
  }

  const onRemove = (index: number) => {
    const line = lines[index]
    dispatch({ type: 'remove', id: line.id })
    if (activeId === line.id) setActiveId(null)
  }

  /** Tapping the empty space under the lines goes to the last line, or starts a new one. */
  const onTapBelow = () => {
    const last = lines[lines.length - 1]
    if (last.text.trim() === '') {
      focus(last.id)
      return
    }
    const inserted = { id: newId(), text: '' }
    dispatch({ type: 'insertAfter', id: last.id, line: inserted })
    focus(inserted.id)
  }

  return (
    <div className="screen plan">
      <header className="top">
        <div>
          <h1>Shopping list</h1>
          <p className="muted small">
            {count === 0 ? 'Nothing yet' : `${count} item${count === 1 ? '' : 's'}`}
          </p>
        </div>
        {count > 0 && (
          <ConfirmButton
            className="ghost"
            confirmLabel="Clear everything?"
            onConfirm={() => dispatch({ type: 'clearList' })}
          >
            Clear
          </ConfirmButton>
        )}
      </header>

      <main className="scroll">
        <ol className="lines" aria-label="Items">
          {lines.map((line, index) => (
            <LineEditor
              key={line.id}
              id={line.id}
              text={line.text}
              history={history}
              active={activeId === line.id}
              wantsFocus={focusId === line.id}
              onFocused={() => setActiveId(line.id)}
              onChange={(text) => dispatch({ type: 'edit', id: line.id, text })}
              onEnter={() => onEnter(index)}
              onBackspaceWhenEmpty={() => onBackspaceWhenEmpty(index)}
              onPasteLines={(texts) => onPasteLines(index, texts)}
              onRemove={() => onRemove(index)}
            />
          ))}
        </ol>
        <div className="tap-below" onClick={onTapBelow} aria-hidden="true" />
      </main>

      <div className="floating">
        <button type="button" className="primary" disabled={count === 0} onClick={onStartShop}>
          Start Shop
        </button>
      </div>
    </div>
  )
}
