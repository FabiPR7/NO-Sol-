import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { Chat, ChatMessage, ReportReasonCode } from '../../../models'
import { uploadChatAudio, uploadChatImage } from '../../services/cloudinary'
import { getChat } from '../../services/chat/getChat'
import { sendMessage, subscribeToMessages } from '../../services/chat/messages'
import { markChatAsRead } from '../../services/chat/unreadMessages'
import {
  blockUser,
  ChatBlockedError,
  hasUserBlockedPartner,
  hideChatForUser,
  isChatBlockedBetween,
  reportUser,
} from '../../services/moderation'
import { setTypingStatus, subscribeToPartnerTyping } from '../../services/chat/typing'
import { getPartnerFromChat } from '../../services/match/mapChatDocument'
import { IconMic, IconPhoto, IconStop, IconVideo } from './ChatComposerIcons'
import ChatConfirmModal from './ChatConfirmModal'
import ChatMediaPreview from './ChatMediaPreview'
import ChatMessageBubble from './ChatMessageBubble'
import ChatOptionsMenu from './ChatOptionsMenu'
import ChatPartnerProfile from './ChatPartnerProfile'
import ChatReportModal from './ChatReportModal'
import './ChatView.css'

const TYPING_IDLE_MS = 2500
const BLOCKED_MESSAGE =
  'No podéis enviar mensajes. Uno de vosotros ha bloqueado al otro.'

type ConfirmAction = 'block' | 'delete' | null

function getSupportedAudioMimeType(): string | undefined {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']

  return types.find((type) => MediaRecorder.isTypeSupported(type))
}

type PendingPhoto = {
  file: File
  previewUrl: string
}

type PendingAudio = {
  blob: Blob
  previewUrl: string
}

type ChatViewProps = {
  userId: string
  chatId: string
  onBack: () => void
}

function ChatView({ userId, chatId, onBack }: ChatViewProps) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null)
  const [pendingAudio, setPendingAudio] = useState<PendingAudio | null>(null)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [showPartnerProfile, setShowPartnerProfile] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockedByMe, setBlockedByMe] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioMimeTypeRef = useRef<string>('audio/webm')

  const clearPendingPhoto = useCallback(() => {
    setPendingPhoto((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl)
      }

      return null
    })
  }, [])

  const clearPendingAudio = useCallback(() => {
    setPendingAudio((current) => {
      if (current) {
        URL.revokeObjectURL(current.previewUrl)
      }

      return null
    })
  }, [])

  const clearOwnTyping = useCallback(() => {
    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current)
      typingIdleTimeoutRef.current = null
    }

    void setTypingStatus(chatId, userId, false)
  }, [chatId, userId])

  const notifyTyping = useCallback(() => {
    void setTypingStatus(chatId, userId, true)

    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current)
    }

    typingIdleTimeoutRef.current = setTimeout(() => {
      void setTypingStatus(chatId, userId, false)
      typingIdleTimeoutRef.current = null
    }, TYPING_IDLE_MS)
  }, [chatId, userId])

  const stopMediaStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
  }, [])

  useEffect(() => {
    getChat(chatId)
      .then(setChat)
      .catch(() => setError('No se pudo cargar el chat.'))
      .finally(() => setLoading(false))
  }, [chatId])

  useEffect(() => {
    return subscribeToMessages(
      chatId,
      setMessages,
      () => setError('No se pudieron cargar los mensajes.'),
    )
  }, [chatId])

  useEffect(() => {
    if (!chat) return

    void markChatAsRead(chatId, userId)
  }, [chat, chatId, userId, messages.length])

  useEffect(() => {
    if (!chat) return

    const partner = getPartnerFromChat(chat, userId)

    return subscribeToPartnerTyping(chatId, partner.id, setPartnerTyping)
  }, [chat, chatId, userId])

  useEffect(() => {
    if (!chat) return

    const currentPartner = getPartnerFromChat(chat, userId)

    void Promise.all([
      isChatBlockedBetween(userId, currentPartner.id),
      hasUserBlockedPartner(userId, currentPartner.id),
    ]).then(([blocked, blockedByCurrentUser]) => {
      setIsBlocked(blocked)
      setBlockedByMe(blockedByCurrentUser)
    })
  }, [chat, userId])

  useEffect(() => {
    return () => {
      clearOwnTyping()
      mediaRecorderRef.current?.stop()
      stopMediaStream()
      clearPendingPhoto()
      clearPendingAudio()
    }
  }, [clearOwnTyping, stopMediaStream, clearPendingPhoto, clearPendingAudio])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, partnerTyping])

  const partner = chat ? getPartnerFromChat(chat, userId) : null
  const previewOpen = Boolean(pendingPhoto || pendingAudio)
  const busy = sending || recording || previewOpen
  const composerDisabled = busy || isBlocked

  const handleSendError = (err: unknown) => {
    if (err instanceof ChatBlockedError) {
      setIsBlocked(true)
      setError(BLOCKED_MESSAGE)
      return
    }

    setError('No se pudo enviar el mensaje.')
  }

  const handleBlockRequest = () => {
    setOptionsOpen(false)
    setConfirmAction('block')
  }

  const handleDeleteRequest = () => {
    setOptionsOpen(false)
    setConfirmAction('delete')
  }

  const handleReportOpen = () => {
    setOptionsOpen(false)
    setReportOpen(true)
  }

  const confirmBlock = async () => {
    if (!partner) return

    setActionLoading(true)
    setError(null)

    try {
      await blockUser(userId, partner.id, chatId)
      setIsBlocked(true)
      setBlockedByMe(true)
      setNotice(`Has bloqueado a ${partner.alias}. Ya no podéis enviar mensajes.`)
      setConfirmAction(null)
    } catch {
      setError('No se pudo bloquear a este usuario.')
    } finally {
      setActionLoading(false)
    }
  }

  const confirmDelete = async () => {
    setActionLoading(true)
    setError(null)

    try {
      await hideChatForUser(userId, chatId)
      onBack()
    } catch {
      setError('No se pudo eliminar el chat.')
      setActionLoading(false)
    }
  }

  const handleReportSubmit = async (input: {
    motivoCodigo: ReportReasonCode
    motivoTexto: string
    detalle?: string
  }) => {
    if (!partner) return

    setActionLoading(true)
    setError(null)

    try {
      await reportUser({
        denuncianteId: userId,
        denunciadoId: partner.id,
        chatId,
        motivoCodigo: input.motivoCodigo,
        motivoTexto: input.motivoTexto,
        detalle: input.detalle,
      })
      setReportOpen(false)
      setNotice('Denuncia enviada. Gracias por ayudarnos a cuidar la comunidad.')
    } catch {
      throw new Error('REPORT_FAILED')
    } finally {
      setActionLoading(false)
    }
  }

  const handleVideoCall = () => {
    setOptionsOpen(false)
    setNotice('La videollamada estará disponible muy pronto.')
  }

  const handleTextChange = (value: string) => {
    setText(value)

    if (value.trim()) {
      notifyTyping()
    } else {
      clearOwnTyping()
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const contenido = text.trim()
    if (!contenido || composerDisabled || !partner) return

    clearOwnTyping()
    setSending(true)
    setError(null)

    try {
      await sendMessage(
        chatId,
        {
          emisor_id: userId,
          tipo: 'texto',
          contenido,
        },
        partner.id,
      )
      setText('')
    } catch (err) {
      handleSendError(err)
    } finally {
      setSending(false)
    }
  }

  const handlePhotoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !file.type.startsWith('image/') || composerDisabled) {
      return
    }

    setError(null)
    clearPendingPhoto()

    setPendingPhoto({
      file,
      previewUrl: URL.createObjectURL(file),
    })
  }

  const confirmPhotoSend = async () => {
    if (!pendingPhoto || sending || !partner) return

    setSending(true)
    setError(null)

    try {
      const mediaUrl = await uploadChatImage(pendingPhoto.file, chatId, userId)

      await sendMessage(
        chatId,
        {
          emisor_id: userId,
          tipo: 'imagen',
          contenido: '',
          media_url: mediaUrl,
        },
        partner.id,
      )

      clearPendingPhoto()
    } catch (err) {
      handleSendError(err)
    } finally {
      setSending(false)
    }
  }

  const confirmAudioSend = async () => {
    if (!pendingAudio || sending || !partner) return

    setSending(true)
    setError(null)

    try {
      const mediaUrl = await uploadChatAudio(pendingAudio.blob, chatId, userId)

      await sendMessage(
        chatId,
        {
          emisor_id: userId,
          tipo: 'audio',
          contenido: '',
          media_url: mediaUrl,
        },
        partner.id,
      )

      clearPendingAudio()
    } catch (err) {
      handleSendError(err)
    } finally {
      setSending(false)
    }
  }

  const startRecording = async () => {
    if (composerDisabled) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite grabar audio.')
      return
    }

    setError(null)
    clearPendingAudio()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedAudioMimeType()
      audioMimeTypeRef.current = mimeType ?? 'audio/webm'

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      )

      audioChunksRef.current = []
      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        stopMediaStream()

        const blob = new Blob(audioChunksRef.current, {
          type: audioMimeTypeRef.current,
        })

        audioChunksRef.current = []

        if (blob.size > 0) {
          setPendingAudio({
            blob,
            previewUrl: URL.createObjectURL(blob),
          })
        }
      }

      recorder.start()
      setRecording(true)
    } catch {
      stopMediaStream()
      setError('No se pudo acceder al micrófono.')
    }
  }

  const stopRecording = () => {
    if (!recording) return

    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecording(false)
  }

  const toggleRecording = () => {
    if (recording) {
      stopRecording()
      return
    }

    void startRecording()
  }

  if (loading) {
    return (
      <section className="chat-view">
        <p className="chat-view__loading">Cargando conversación...</p>
      </section>
    )
  }

  if (!chat || !partner) {
    return (
      <section className="chat-view">
        <p className="chat-view__error">No se encontró la conversación.</p>
        <button type="button" onClick={onBack}>
          Volver
        </button>
      </section>
    )
  }

  if (showPartnerProfile) {
    return (
      <ChatPartnerProfile
        partnerId={partner.id}
        partnerAlias={partner.alias}
        partnerPhoto={partner.foto_url}
        onBack={() => setShowPartnerProfile(false)}
      />
    )
  }

  return (
    <section className="chat-view">
      {pendingPhoto && (
        <ChatMediaPreview
          kind="photo"
          previewUrl={pendingPhoto.previewUrl}
          sending={sending}
          onConfirm={() => void confirmPhotoSend()}
          onCancel={clearPendingPhoto}
        />
      )}

      {pendingAudio && (
        <ChatMediaPreview
          kind="audio"
          previewUrl={pendingAudio.previewUrl}
          sending={sending}
          onConfirm={() => void confirmAudioSend()}
          onCancel={clearPendingAudio}
        />
      )}

      <header className="chat-view__header">
        <button type="button" className="chat-view__back" onClick={onBack}>
          ←
        </button>
        <button
          type="button"
          className="chat-view__partner-btn"
          onClick={() => setShowPartnerProfile(true)}
          aria-label={`Ver perfil de ${partner.alias}`}
        >
          <span className="chat-view__partner-avatar">
            {partner.foto_url ? (
              <img src={partner.foto_url} alt="" />
            ) : (
              <div className="chat-view__avatar-fallback">
                {partner.alias.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className={`chat-view__online-dot${
                partnerTyping ? ' chat-view__online-dot--typing' : ''
              }`}
              aria-hidden="true"
            />
          </span>
          <span className="chat-view__partner-meta">
            <strong>{partner.alias}</strong>
            <span className="chat-view__status-row">
              <span
                className={
                  partnerTyping ? 'chat-view__status chat-view__status--typing' : 'chat-view__status'
                }
              >
                {partnerTyping ? 'Escribiendo...' : 'Conectados ahora'}
              </span>
            </span>
          </span>
        </button>
        <div className="chat-view__header-actions">
          <button
            type="button"
            className="chat-view__video-btn"
            aria-label="Iniciar videollamada"
            disabled={isBlocked}
            onClick={handleVideoCall}
          >
            <IconVideo />
          </button>

          <div className="chat-view__menu-wrap">
            <button
              type="button"
              className="chat-view__menu-btn"
              aria-label="Opciones del chat"
              aria-expanded={optionsOpen}
              onClick={() => setOptionsOpen((open) => !open)}
            >
              ⋮
            </button>
            <ChatOptionsMenu
              open={optionsOpen}
              onClose={() => setOptionsOpen(false)}
              onBlock={handleBlockRequest}
              onReport={handleReportOpen}
              onDeleteChat={handleDeleteRequest}
            />
          </div>
        </div>
      </header>

      {isBlocked && (
        <p className="chat-view__blocked-banner">
          {blockedByMe
            ? `Has bloqueado a ${partner.alias}. Ninguno podéis enviar mensajes.`
            : BLOCKED_MESSAGE}
        </p>
      )}

      {notice && <p className="chat-view__notice">{notice}</p>}

      <div className="chat-view__messages">
        {messages.length === 0 ? (
          <p className="chat-view__empty">
            Ya estáis conectados. Escribe el primer mensaje cuando quieras.
          </p>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              isMine={message.emisor_id === userId}
            />
          ))
        )}

        {partnerTyping && (
          <div className="chat-view__typing" aria-live="polite">
            <span className="chat-view__typing-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            {partner.alias} está escribiendo
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <p className="chat-view__error">{error}</p>}

      {recording && (
        <p className="chat-view__recording" aria-live="polite">
          Grabando audio... Pulsa el botón rojo para previsualizar.
        </p>
      )}

      <form className="chat-view__composer" onSubmit={handleSubmit}>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="chat-view__file-input"
          onChange={handlePhotoSelect}
        />

        <button
          type="button"
          className="chat-view__media-btn chat-view__media-btn--photo"
          aria-label="Elegir foto"
          disabled={composerDisabled}
          onClick={() => photoInputRef.current?.click()}
        >
          <IconPhoto />
        </button>

        <button
          type="button"
          className={`chat-view__media-btn chat-view__media-btn--mic${
            recording ? ' chat-view__media-btn--recording' : ''
          }`}
          aria-label={recording ? 'Detener grabación' : 'Grabar audio'}
          disabled={sending || previewOpen || isBlocked}
          onClick={toggleRecording}
        >
          {recording ? <IconStop /> : <IconMic />}
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={clearOwnTyping}
          placeholder={isBlocked ? 'Chat bloqueado' : 'Escribe un mensaje...'}
          maxLength={1000}
          disabled={composerDisabled}
        />

        <button
          type="submit"
          className="chat-view__send-btn"
          disabled={composerDisabled || !text.trim()}
        >
          Enviar
        </button>
      </form>

      <ChatReportModal
        open={reportOpen}
        partnerAlias={partner.alias}
        submitting={actionLoading}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
      />

      <ChatConfirmModal
        open={confirmAction === 'block'}
        title={`Bloquear a ${partner.alias}`}
        description="Ni tú ni esta persona podréis enviar mensajes. Podéis seguir viendo la conversación."
        confirmLabel="Bloquear"
        danger
        loading={actionLoading}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void confirmBlock()}
      />

      <ChatConfirmModal
        open={confirmAction === 'delete'}
        title="Eliminar chat"
        description="Este chat desaparecerá de tu lista. La otra persona seguirá viéndolo."
        confirmLabel="Eliminar"
        danger
        loading={actionLoading}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  )
}

export default ChatView
