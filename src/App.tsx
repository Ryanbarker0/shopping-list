import { PlanView } from './components/PlanView'
import { ShopView } from './components/ShopView'
import { useShoppingList } from './state/useShoppingList'

export default function App() {
  const { state, dispatch } = useShoppingList()
  return state.mode === 'shop' ? (
    <ShopView state={state} dispatch={dispatch} />
  ) : (
    <PlanView state={state} dispatch={dispatch} />
  )
}
