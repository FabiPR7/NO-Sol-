import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import type { Chat, ChatMessage, Usuario } from '../../../models'
import { getChat } from '../../services/chat/getChat'
import { sendMessage, subscribeToMessages } from '../../services/chat/messages'
import {
  getPartnerFromChat,
} from '../../services/match/mapChatDocument'
import { joinMatchQueue, leaveMatchQueue, listenForMatch } from '../../services/match'
import './ChatSessionScreen.css'

type ChatSessionScreenProps = {
  userId: string
  profile: Partial<Usuario>
  onClose: () => void
}

function ChatSessionScreen({ userId, profile, onClose }: ChatSessionScreenProps) {
  const [chatId, setChatId] = useState<string | null>(null)
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [matching, setMatching] = useState(true)
  const [status, setStatus] = useState('Buscando a alguien compatible contigo...')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const matchedRef = useRef(false)

  const handleClose = useCallback(async () => {
    if (matching) {
      await leaveMatchQueue(userId)
    }
    onClose()
  }, [matching, onClose, userId])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    const searchStartedAt = Date.now()

    const startMatching = async () => {
      try {
        const entry = await joinMatchQueue(userId, profile, 'chat')

        unsubscribe = listenForMatch(
          userId,
          entry.es_menor,
          'chat',
          searchStartedAt,
          (newChatId) => {
            if (matchedRef.current) return
            matchedRef.current = true
            setChatId(newChatId)
            setMatching(false)
            setStatus('¡Conectado!')
          },
          () => setError('No se pudo completar la búsqueda.'),
        )
      } catch {
        setError('No se pudo iniciar la búsqueda.')
      }
    }

    void startMatching()

    return () => {
      unsubscribe?.()
      if (!matchedRef.current) {
        void leaveMatchQueue(userId)
      }
    }
  }, [userId, profile])

  useEffect(() => {
    if (!chatId) return

    getChat(chatId)
      .then(setChat)
      .catch(() => setError('No se pudo cargar la conversación.'))
  }, [chatId])

  useEffect(() => {
    if (!chatId || matching) return

    return subscribeToMessages(
      chatId,
      setMessages,
      () => setError('No se pudieron cargar los mensajes.'),
    )
  }, [chatId, matching])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const partner = chat ? getPartnerFromChat(chat, userId) : null
  const canSend = !matching && chatId && text.trim() && !sending

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const contenido = text.trim()
    if (!canSend || !chatId) return

    setSending(true)
    setError(null)

    try {
      await sendMessage(chatId, { emisor_id: userId, tipo: 'texto', contenido })
      setText('')
    } catch {
      setError('No se pudo enviar el mensaje.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="chat-session">
      <header className="chat-session__header">
        <button type="button" className="chat-session__back" onClick={() => void handleClose()}>
          ←
        </button>

        <div className="chat-session__partner">
          {matching || !partner ? (
            <>
              <div className="chat-session__avatar-skeleton" aria-hidden="true" />
              <div>
                <strong>Buscando compañía</strong>
                <span>Espera un momento...</span>
              </div>
            </>
          ) : (
            <>
              {partner.foto_url ? (
                <img src={partner.foto_url} alt={partner.alias} />
              ) : (
                <div className="chat-session__avatar-fallback">
                  {partner.alias.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <strong>{partner.alias}</strong>
                <span>Conectados ahora</span>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="chat-session__body">
        {matching ? (
          <div className="chat-session__matching">
            <div className="chat-session__spinner" aria-hidden="true" />
            <p>{status}</p>
            <span>
              Respetamos tus filtros y tu grupo de edad. Conectamos a quien busca
              compañía con quien quiere acompañar.
            </span>
          </div>
        ) : messages.length === 0 ? (
          <p className="chat-session__empty">
            Ya estáis conectados. Escribe el primer mensaje cuando quieras.
          </p>
        ) : (
          <div className="chat-session__messages">
            {messages.map((message) => {
              const isMine = message.emisor_id === userId

              return (
                <div
                  key={message.id}
                  className={`chat-session__bubble${
                    isMine ? ' chat-session__bubble--mine' : ' chat-session__bubble--theirs'
                  }`}
                >
                  {message.contenido}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && <p className="chat-session__error">{error}</p>}

      <form className="chat-session__composer" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={matching ? 'Esperando conexión...' : 'Escribe un mensaje...'}
          maxLength={1000}
          disabled={matching || sending}
        />
        <button type="submit" disabled={!canSend}>
          Enviar
        </button>
      </form>
    </section>
  )
}

export default ChatSessionScreen
