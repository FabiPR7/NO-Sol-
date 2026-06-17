import type { ChatMessage } from '../../../models'
import ChatAudioMessage from './ChatAudioMessage'
import './ChatMessageBubble.css'

type ChatMessageBubbleProps = {
  message: ChatMessage
  isMine: boolean
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MessageTime({ date }: { date: Date }) {
  return (
    <time className="chat-message__time" dateTime={date.toISOString()}>
      {formatMessageTime(date)}
    </time>
  )
}

function ChatMessageBubble({ message, isMine }: ChatMessageBubbleProps) {
  const bubbleClass = `chat-message${
    isMine ? ' chat-message--mine' : ' chat-message--theirs'
  }`

  if (message.tipo === 'imagen' && message.media_url) {
    return (
      <div className={`${bubbleClass} chat-message--media`}>
        <a href={message.media_url} target="_blank" rel="noreferrer">
          <img
            className="chat-message__image"
            src={message.media_url}
            alt={message.contenido || 'Imagen enviada'}
            loading="lazy"
          />
        </a>
        {message.contenido && <p className="chat-message__caption">{message.contenido}</p>}
        <MessageTime date={message.enviado_en} />
      </div>
    )
  }

  if (message.tipo === 'audio' && message.media_url) {
    return (
      <div className={`${bubbleClass} chat-message--audio`}>
        <ChatAudioMessage src={message.media_url} isMine={isMine} />
        <MessageTime date={message.enviado_en} />
      </div>
    )
  }

  return (
    <div className={bubbleClass}>
      <p className="chat-message__text">{message.contenido}</p>
      <MessageTime date={message.enviado_en} />
    </div>
  )
}

export default ChatMessageBubble
