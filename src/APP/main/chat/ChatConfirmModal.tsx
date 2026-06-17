import './ChatConfirmModal.css'

type ChatConfirmModalProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  loading?: boolean
  danger?: boolean
  onClose: () => void
  onConfirm: () => void
}

function ChatConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  loading = false,
  danger = false,
  onClose,
  onConfirm,
}: ChatConfirmModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="chat-confirm-modal" role="dialog" aria-modal="true">
      <button type="button" className="chat-confirm-modal__backdrop" aria-label="Cerrar" onClick={onClose} />
      <div className="chat-confirm-modal__panel">
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="chat-confirm-modal__actions">
          <button type="button" className="chat-confirm-modal__cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={`chat-confirm-modal__confirm${
              danger ? ' chat-confirm-modal__confirm--danger' : ''
            }`}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatConfirmModal
