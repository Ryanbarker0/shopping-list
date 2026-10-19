import { useEffect, useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { formatQuantity, hasQuantity, parseLine, quantityAsTyped } from '../lib/parseLine'
import { suggest } from '../lib/suggest'

interface Props {
  id: string
  text: string
  history: readonly string[]
  /** Whether this line is the one being typed on; suggestions show only for that line. */
  active: boolean
  /** Set when this line should take the keyboard, for example after Enter made it. */
  wantsFocus: boolean
  onFocused: () => void
  onChange: (text: string) => void
  onEnter: () => void
  onBackspaceWhenEmpty: () => void
  onPasteLines: (texts: string[]) => void
  onRemove: () => void
}

export function LineEditor({
  id,
  text,
  history,
  active,
  wantsFocus,
  onFocused,
  onChange,
  onEnter,
  onBackspaceWhenEmpty,
  onPasteLines,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!wantsFocus) return
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }, [wantsFocus])

  const parsed = parseLine(text)
  const suggestions = active ? suggest(parsed.name, history) : []

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onEnter()
    } else if (event.key === 'Backspace' && text === '') {
      event.preventDefault()
      onBackspaceWhenEmpty()
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text')
    if (!pasted.includes('\n')) return
    const texts = pasted
      .split(/\r?\n/)
      .map((t) => t.replace(/^\s*[-*•]\s*/, '').trim())
      .filter((t) => t !== '')
    if (texts.length === 0) return
    event.preventDefault()
    onPasteLines(texts)
  }

  const pick = (name: string) => {
    const suffix = hasQuantity(parsed.quantity) ? ` ${quantityAsTyped(parsed.quantity)}` : ''
    onChange(`${name}${suffix}`)
    // Tapping a chip takes focus off the field on some phones; put it back so typing carries on.
    inputRef.current?.focus()
  }

  const hint = formatQuantity(parsed.quantity)

  return (
    <li className={`line${active ? ' active' : ''}`}>
      <div className="line-row">
        <span className="line-dot" aria-hidden="true" />
        <input
          ref={inputRef}
          id={`line-${id}`}
          className="line-input"
          type="text"
          value={text}
          placeholder="Add an item"
          aria-label="Item"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          enterKeyHint="next"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onFocus={onFocused}
        />
        {hint !== '' && <span className="line-hint">{hint}</span>}
        {text !== '' && (
          <button
            type="button"
            className="ghost icon line-remove"
            aria-label={`Remove ${parsed.name || 'line'}`}
            onClick={onRemove}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M2 2l10 10M12 2L2 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="suggestions" role="group" aria-label="Suggestions">
          {suggestions.map((name) => (
            <button
              type="button"
              key={name}
              className="chip"
              // Keep the keyboard up: a mousedown on the chip would otherwise blur the field first.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}
