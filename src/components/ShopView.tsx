import { useMemo, useRef, type CSSProperties, type Dispatch } from 'react'
import { formatQuantity } from '../lib/parseLine'
import { groupItems, itemsFrom } from '../lib/shop'
import type { ListState } from '../lib/storage'
import type { Action } from '../state/useShoppingList'
import { CategoryPicker } from './CategoryPicker'
import { ConfirmButton } from './ConfirmButton'
import { useFlyIn } from './useFlyIn'

interface Props {
  state: ListState
  dispatch: Dispatch<Action>
  /** Where each line was on the plan screen, keyed by line id, for the opening animation. */
  flyFrom: ReadonlyMap<string, DOMRect>
}

export function ShopView({ state, dispatch, flyFrom }: Props) {
  const { lines, checked, overrides } = state
  const listRef = useRef<HTMLElement>(null)
  useFlyIn(listRef, flyFrom)
  const items = useMemo(() => itemsFrom(lines, checked), [lines, checked])
  const groups = useMemo(() => groupItems(items, overrides), [items, overrides])
  const done = items.filter((i) => i.checked).length
  const allDone = done === items.length

  return (
    <div className="screen shop">
      <header className="top">
        <div>
          <h1>Shop</h1>
          <p className="muted small" aria-live="polite">
            {allDone ? 'All done 🎉' : `${done} of ${items.length} picked up`}
          </p>
        </div>
        <button type="button" className="ghost" onClick={() => dispatch({ type: 'backToPlan' })}>
          Edit list
        </button>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={done}
          aria-label="Picked up"
        >
          <span style={{ width: `${items.length === 0 ? 0 : (done / items.length) * 100}%` }} />
        </div>
      </header>

      <main className="scroll" ref={listRef}>
        {groups.map((group, groupIndex) => {
          const groupDone = group.items.filter((i) => i.checked).length
          return (
            <section
              key={group.category}
              className={`group${groupDone === group.items.length ? ' done' : ''}`}
              data-category={group.category}
              style={{ '--enter-delay': `${groupIndex * 90}ms` } as CSSProperties}
              aria-labelledby={`group-${group.category}`}
            >
              <h3 id={`group-${group.category}`}>
                <span className="group-title">
                  <span className="group-emoji" aria-hidden="true">
                    {group.emoji}
                  </span>
                  {group.label}
                </span>
                <span className="group-count">
                  {groupDone}/{group.items.length}
                </span>
              </h3>
              <ul className="items">
                {group.items.map((item) => {
                  const quantity = formatQuantity(item.quantity)
                  return (
                    <li
                      key={item.id}
                      className={`item${item.checked ? ' checked' : ''}`}
                      data-item-id={item.id}
                    >
                      <label className="item-main">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => dispatch({ type: 'toggle', id: item.id })}
                        />
                        <span className="box" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 14 14">
                            <path
                              d="M2.5 7.5l3 3 6-6.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="item-name">{item.name}</span>
                        {quantity !== '' && <span className="item-qty">{quantity}</span>}
                      </label>
                      <CategoryPicker
                        name={item.name}
                        value={group.category}
                        onChange={(category) =>
                          dispatch({ type: 'setCategory', name: item.name, category })
                        }
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </main>

      <div className="floating">
        <ConfirmButton
          className={allDone ? 'primary' : ''}
          confirmLabel={`Finish with ${items.length - done} left?`}
          needsConfirm={!allDone}
          onConfirm={() => dispatch({ type: 'cleanUp' })}
        >
          Clean up
        </ConfirmButton>
      </div>
    </div>
  )
}
