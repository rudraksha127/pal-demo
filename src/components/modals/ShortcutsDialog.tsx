import { Keyboard } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'

interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SHORTCUTS = [
  { key: 'Space', desc: 'Toggle Play / Pause simulation' },
  { key: 'R', desc: 'Reset simulation to starting snapshot' },
  { key: 'F', desc: 'Toggle Fullscreen 3D Viewport' },
  { key: 'M', desc: 'Toggle Tactical Audio FX' },
  { key: '1 - 5', desc: 'Isolate specific building floor level' },
  { key: '0 or A', desc: 'Show all floors simultaneously' },
  { key: 'V', desc: 'Cycle camera views (Drone, Street, Victim, Top-Down)' },
  { key: 'Esc', desc: 'Close dialogs or clear selection' },
]

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: '520px' }}>
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(45, 240, 138, 0.12)',
                color: 'var(--color-emerald-bright)',
                border: '1px solid rgba(45, 240, 138, 0.3)',
              }}
            >
              <Keyboard size={20} />
            </span>
            <div>
              <DialogTitle>Console Keyboard Shortcuts</DialogTitle>
              <DialogDescription>Quick tactical controls for high-speed rescue operations</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(8, 20, 13, 0.55)',
                border: '1px solid rgba(86, 235, 163, 0.1)',
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{s.desc}</span>
              <kbd
                style={{
                  padding: '3px 8px',
                  borderRadius: '5px',
                  background: 'rgba(23, 77, 50, 0.6)',
                  border: '1px solid rgba(45, 240, 138, 0.3)',
                  color: 'var(--color-emerald-bright)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="shadcn-dialog-footer" style={{ marginTop: '20px' }}>
          <button className="primary-button" onClick={() => onOpenChange(false)}>
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
