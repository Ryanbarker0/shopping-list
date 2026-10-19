import { useState } from 'react'
import { PlanView } from './components/PlanView'
import { ShopView } from './components/ShopView'
import { useShoppingList } from './state/useShoppingList'

export default function App() {
  const { state, dispatch } = useShoppingList()
  // Where each line sat on screen when Start Shop was pressed, so the shop view can fly the
  // items from there into their sections. Empty on a reload straight into the shop.
  const [flyFrom, setFlyFrom] = useState<ReadonlyMap<string, DOMRect>>(() => new Map())

  const startShop = () => {
    const from = new Map<string, DOMRect>()
    for (const el of document.querySelectorAll<HTMLElement>('[data-line-id]')) {
      from.set(el.dataset.lineId!, el.getBoundingClientRect())
    }
    // Both updates land in the same render, so the shop view mounts with the positions ready.
    setFlyFrom(from)
    dispatch({ type: 'startShop' })
  }

  return state.mode === 'shop' ? (
    <ShopView state={state} dispatch={dispatch} flyFrom={flyFrom} />
  ) : (
    <PlanView state={state} dispatch={dispatch} onStartShop={startShop} />
  )
}
