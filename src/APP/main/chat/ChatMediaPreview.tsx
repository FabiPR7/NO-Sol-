import './ChatMediaPreview.css'

type ChatMediaPreviewProps = {
  kind: 'photo' | 'audio'
  previewUrl: string
  sending: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ChatMediaPreview({
  kind,
  previewUrl,
  sending,
  onConfirm,
  onCancel,
}: ChatMediaPreviewProps) {
  const title = kind === 'photo' ? '¿Enviar esta foto?' : '¿Enviar este audio?'

  return (
    <div className="chat-media-preview" role="dialog" aria-modal="true" aria-labelledby="chat-media-preview-title">
      <div className="chat-media-preview__backdrop" onClick={sending ? undefined : onCancel} />

      <div className="chat-media-preview__card">
        <h2 id="chat-media-preview-title" className="chat-media-preview__title">
          {title}
        </h2>

        <div className="chat-media-preview__content">
          {kind === 'photo' ? (
            <img
              className="chat-media-preview__photo"
              src={previewUrl}
              alt="Vista previa de la foto"
            />
          ) : (
            <div className="chat-media-preview__audio-wrap">
              <audio className="chat-media-preview__audio" controls src={previewUrl}>
                Tu navegador no puede reproducir audios.
              </audio>
              <p>Escucha el audio antes de enviarlo.</p>
            </div>
          )}
        </div>

        <div className="chat-media-preview__actions">
          <button
            type="button"
            className="chat-media-preview__btn chat-media-preview__btn--cancel"
            onClick={onCancel}
            disabled={sending}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="chat-media-preview__btn chat-media-preview__btn--confirm"
            onClick={onConfirm}
            disabled={sending}
          >
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatMediaPreview
