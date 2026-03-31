import { useState, useCallback } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

export function useConfirm() {
  const [state, setState] = useState<{
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = useCallback((message: string, options?: Omit<ConfirmOptions, 'message'>) => {
    return new Promise<boolean>(resolve => {
      setState({ options: { message, ...options }, resolve })
    })
  }, [])

  const handleConfirm = () => { state?.resolve(true);  setState(null) }
  const handleCancel  = () => { state?.resolve(false); setState(null) }

  const ConfirmModalElement = state ? (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <h2 className="confirm-modal-title">
          {state.options.title ?? 'Confirmer la suppression'}
        </h2>
        <p className="confirm-modal-message">{state.options.message}</p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={handleCancel}>Annuler</button>
          <button
            className={state.options.danger !== false ? 'btn-danger' : 'btn-primary'}
            onClick={handleConfirm}
            autoFocus
          >
            {state.options.confirmLabel ?? 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return { confirm, ConfirmModalElement }
}
