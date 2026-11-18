import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useRfFense } from '../RfFenseContext'
import type { RfTone } from '../types'

function ToastIcon({ tone }: { tone: RfTone }) {
  if (tone === 'success') return <CheckCircle2 size={15} aria-hidden="true" />
  if (tone === 'warning') return <AlertTriangle size={15} aria-hidden="true" />
  if (tone === 'danger') return <AlertTriangle size={15} aria-hidden="true" />
  return <Info size={15} aria-hidden="true" />
}

export function RfToasts() {
  const { toasts, dismissToast } = useRfFense()

  return (
    <div className="toasts" role="region" aria-live="polite" aria-label="Simulation notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
          <span className="toast__icon">
            <ToastIcon tone={toast.tone} />
          </span>
          <div className="toast__copy">
            <strong>{toast.title}</strong>
            {toast.message && <span>{toast.message}</span>}
          </div>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismissToast(toast.id)}
            aria-label={`Dismiss notification: ${toast.title}`}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
