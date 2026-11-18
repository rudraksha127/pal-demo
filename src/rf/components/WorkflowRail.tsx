import { Check, LockKeyhole, Route } from 'lucide-react'
import { useRfFense } from '../RfFenseContext'
import { SCENES } from '../data'

export function WorkflowRail() {
  const { scene } = useRfFense()
  const progress = Math.round(((scene - 1) / 11) * 100)

  return (
    <aside className="rf-rail panel" aria-label="Twelve-scene workflow">
      <div className="rf-rail__head">
        <span className="rf-rail__icon" aria-hidden="true">
          <Route size={16} />
        </span>
        <div>
          <h2>Workflow</h2>
          <p>
            Scene {scene} of 12
          </p>
        </div>
        <span className="rf-rail__pct">{progress}%</span>
      </div>
      <div className="rf-rail__progress" aria-hidden="true">
        <span style={{ width: `${Math.max(4, progress)}%` }} />
      </div>

      <ol className="rf-rail__list">
        {SCENES.map((item) => {
          const done = item.id < scene
          const current = item.id === scene
          const state = done ? 'done' : current ? 'current' : 'upcoming'
          return (
            <li
              key={item.id}
              className={`rf-rail__item rf-rail__item--${state}`}
              aria-current={current ? 'step' : undefined}
            >
              <span className="rf-rail__num" aria-hidden="true">
                {done ? <Check size={12} /> : item.id}
              </span>
              <span className="rf-rail__copy">
                <strong>{item.label}</strong>
                <small>{item.short}</small>
              </span>
              {state === 'upcoming' && (
                <span className="rf-rail__lock" aria-label="Available later">
                  <LockKeyhole size={11} aria-hidden="true" />
                </span>
              )}
            </li>
          )
        })}
      </ol>

      <p className="rf-rail__note">
        Steps unlock as the preceding scene is completed. Restart is available from every scene.
      </p>
    </aside>
  )
}
