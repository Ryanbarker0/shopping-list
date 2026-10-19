import { CATEGORIES, type CategoryId } from '../lib/categories'

interface Props {
  name: string
  value: CategoryId
  onChange: (category: CategoryId) => void
}

/** A small control that opens the phone's own picker to move an item to another section. */
export function CategoryPicker({ name, value, onChange }: Props) {
  return (
    <span className="move">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 7h16M4 12h16M4 17h10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M17 15l3 2.5-3 2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <select
        aria-label={`Section for ${name}`}
        value={value}
        onChange={(e) => onChange(e.target.value as CategoryId)}
      >
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </span>
  )
}
