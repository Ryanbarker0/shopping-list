import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** What the button says while waiting for the second tap. */
  confirmLabel: string
  onConfirm: () => void
  className?: string
  /** When false the action runs on the first tap; nothing is lost so no confirmation is needed. */
  needsConfirm?: boolean
  disabled?: boolean
}

/**
 * A button for things that throw work away. The first tap asks, the second tap does it,
 * and the question goes away by itself if the second tap does not come.
 */
export function ConfirmButton({
  children,
  confirmLabel,
  onConfirm,
  className,
  needsConfirm = true,
  disabled,
}: Props) {
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    if (!asking) return
    const timer = setTimeout(() => setAsking(false), 4000)
    return () => clearTimeout(timer)
  }, [asking])

  const onClick = () => {
    if (needsConfirm && !asking) {
      setAsking(true)
      return
    }
    setAsking(false)
    onConfirm()
  }

  return (
    <button
      type="button"
      className={[className, asking ? 'asking' : ''].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {asking ? confirmLabel : children}
    </button>
  )
}
