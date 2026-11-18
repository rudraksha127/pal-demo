import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from 'lucide-react'
import { useSimulation } from '../state/SimulationContext'
import type { Tone } from '../types'

function ToastIcon({ tone }: { tone: Tone }) {
  if (tone === 'success') return <CheckCircle2 size={15} />
  if (tone === 'warning') return <AlertTriangle size={15} />
  if (tone === 'danger') return <Info size={15} />
  return <Sparkles size={15} />
}

export function Toasts() {
  const { toasts, dismissToast } = useSimulation()

  return (
    <div className="toasts" role="region" aria-live="polite" aria-label="System notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
          <span className="toast__icon">
            <ToastIcon tone={toast.tone} />
          </span>
          <div className="toast__copy">
            <strong>{toast.title}</strong>
            {toast.message && <span>{toast.message}</span>}
          </div>
          <button className="toast__close" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
            <X size={12} />
          </button>
          <span className="toast__timer" aria-hidden="true" />
        </div>
      ))}
    </div>
  )
}
