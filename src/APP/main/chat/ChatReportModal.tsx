import { useEffect, useState, type FormEvent } from 'react'
import { REPORT_REASONS, type ReportReasonCode } from '../../../models'
import './ChatReportModal.css'

type ChatReportModalProps = {
  open: boolean
  partnerAlias: string
  submitting: boolean
  onClose: () => void
  onSubmit: (input: {
    motivoCodigo: ReportReasonCode
    motivoTexto: string
    detalle?: string
  }) => Promise<void>
}

function ChatReportModal({
  open,
  partnerAlias,
  submitting,
  onClose,
  onSubmit,
}: ChatReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReasonCode>('1')
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSelectedReason('1')
      setDetail('')
      setError(null)
    }
  }, [open])

  if (!open) {
    return null
  }

  const selectedReasonMeta = REPORT_REASONS.find((reason) => reason.code === selectedReason)
  const requiresDetail = selectedReasonMeta?.requiresDetail ?? false

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    const motivoTexto = selectedReasonMeta?.label ?? 'Otro motivo'

    if (requiresDetail && detail.trim().length < 10) {
      setError('Explica el motivo con al menos 10 caracteres.')
      return
    }

    try {
      await onSubmit({
        motivoCodigo: selectedReason,
        motivoTexto,
        ...(requiresDetail ? { detalle: detail.trim() } : {}),
      })
    } catch {
      setError('No se pudo enviar la denuncia. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="chat-report-modal" role="dialog" aria-modal="true" aria-labelledby="chat-report-title">
      <button
        type="button"
        className="chat-report-modal__backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <form className="chat-report-modal__panel" onSubmit={(event) => void handleSubmit(event)}>
        <header className="chat-report-modal__header">
          <h2 id="chat-report-title">Denunciar a {partnerAlias}</h2>
          <p>Elige un motivo. Podrás seguir chateando con esta persona.</p>
        </header>

        <div className="chat-report-modal__reasons">
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason.code}
              className={`chat-report-modal__reason${
                selectedReason === reason.code ? ' chat-report-modal__reason--active' : ''
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={reason.code}
                checked={selectedReason === reason.code}
                onChange={() => setSelectedReason(reason.code)}
              />
              <span>{reason.label}</span>
            </label>
          ))}
        </div>

        {requiresDetail && (
          <label className="chat-report-modal__detail">
            <span>Cuéntanos qué ha pasado</span>
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Describe el motivo de tu denuncia..."
              rows={4}
              maxLength={500}
            />
          </label>
        )}

        {error && <p className="chat-report-modal__error">{error}</p>}

        <div className="chat-report-modal__actions">
          <button type="button" className="chat-report-modal__cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="chat-report-modal__submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar denuncia'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatReportModal
