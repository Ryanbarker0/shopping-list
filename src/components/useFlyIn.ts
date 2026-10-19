import { useLayoutEffect, type RefObject } from 'react'

/** Gap between one row starting to move and the next, so the list visibly sorts itself. */
const STAGGER_MS = 40
const MOVE_MS = 800
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

/**
 * On first render, every `[data-item-id]` row inside `root` starts where its line was on the
 * previous screen (from `from`) and glides to where it now sits. Rows with no known start
 * simply fade in. Section headings (`.group`) are staggered by the `enter` class in CSS.
 */
export function useFlyIn(root: RefObject<HTMLElement | null>, from: ReadonlyMap<string, DOMRect>) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el || reducedMotion()) return

    const rows = Array.from(el.querySelectorAll<HTMLElement>('[data-item-id]'))
    for (const row of rows) {
      const start = from.get(row.dataset.itemId ?? '')
      // Measure the resting position: React's development double-run of effects would
      // otherwise measure a row already offset by the first run.
      row.style.transition = 'none'
      row.style.transform = ''
      const end = row.getBoundingClientRect()
      if (start) {
        row.style.transform = `translate(${start.left - end.left}px, ${start.top - end.top}px)`
      } else {
        row.style.opacity = '0'
        row.style.transform = 'translateY(12px)'
      }
    }
    for (const group of el.querySelectorAll<HTMLElement>('.group')) group.classList.add('enter')

    // Two frames: the first paints the start positions, the second starts the move.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        rows.forEach((row, i) => {
          const delay = i * STAGGER_MS
          row.style.transition = `transform ${MOVE_MS}ms ${EASE} ${delay}ms, opacity 300ms ease ${delay}ms`
          row.style.transform = ''
          row.style.opacity = ''
          row.addEventListener('transitionend', () => (row.style.transition = ''), { once: true })
        })
      })
    })
    return () => cancelAnimationFrame(frame)
    // Runs once, when the shop view appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
