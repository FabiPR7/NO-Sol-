import { useEffect, useMemo, useState } from 'react'
import type { Chat } from '../../../models'
import {
  formatUnreadCount,
  getChatActivityDate,
  getChatPreviewText,
  hasChatMessages,
  mergeChatPreview,
  subscribeToMissingLastMessagePreviews,
  subscribeToUserChats,
  type ChatLastMessagePreview,
} from '../../services/chat'
import { getPartnerFromChat } from '../../services/match/mapChatDocument'
import './ChatsTab.css'

type ChatsTabProps = {
  userId: string
  unreadCounts: Record<string, number>
  onOpenChat: (chatId: string) => void
}

function formatChatDate(date: Date): string {
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function ChatsTab({ userId, unreadCounts, onOpenChat }: ChatsTabProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [fallbackPreviews, setFallbackPreviews] = useState<
    Record<string, ChatLastMessagePreview>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const chatsMissingPreview = useMemo(
    () => chats.filter((chat) => !hasChatMessages(chat)).map((chat) => chat.id),
    [chats],
  )

  useEffect(() => {
    setLoading(true)

    const unsubscribe = subscribeToUserChats(
      userId,
      (nextChats) => {
        setChats(nextChats)
        setLoading(false)
      },
      () => {
        setError('No se pudieron cargar tus conversaciones.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [userId])

  useEffect(() => {
    if (chatsMissingPreview.length === 0) {
      setFallbackPreviews({})
      return
    }

    return subscribeToMissingLastMessagePreviews(
      chatsMissingPreview,
      (chatId, preview) => {
        setFallbackPreviews((current) => {
          if (!preview) {
            if (!(chatId in current)) {
              return current
            }

            const next = { ...current }
            delete next[chatId]
            return next
          }

          return {
            ...current,
            [chatId]: preview,
          }
        })
      },
    )
  }, [chatsMissingPreview.join('|')])

  return (
    <section className="chats-tab">
      <header className="chats-tab__header">
        <h1>Chats</h1>
        <p>Tus conversaciones activas</p>
      </header>

      {loading && (
        <p className="chats-tab__loading">Cargando conversaciones...</p>
      )}

      {error && <p className="chats-tab__error">{error}</p>}

      {!loading && !error && chats.length === 0 && (
        <div className="chats-tab__empty">
          <span className="chats-tab__emoji">💬</span>
          <h2>Aún no tienes chats</h2>
          <p>
            Cuando encuentres a alguien en la pestaña Buscar, vuestras
            conversaciones aparecerán aquí.
          </p>
        </div>
      )}

      {!loading && chats.length > 0 && (
        <ul className="chats-tab__list">
          {chats.map((chat) => {
            const partner = getPartnerFromChat(chat, userId)
            const unreadCount = unreadCounts[chat.id] ?? 0
            const chatWithPreview = mergeChatPreview(chat, fallbackPreviews[chat.id])
            const previewText = getChatPreviewText(chatWithPreview, userId)

            return (
              <li key={chat.id}>
                <button
                  type="button"
                  className={`chats-tab__item${
                    unreadCount > 0 ? ' chats-tab__item--unread' : ''
                  }`}
                  onClick={() => onOpenChat(chat.id)}
                >
                  <div className="chats-tab__avatar-wrap">
                    {partner.foto_url ? (
                      <img
                        className="chats-tab__avatar"
                        src={partner.foto_url}
                        alt={partner.alias}
                      />
                    ) : (
                      <div className="chats-tab__avatar chats-tab__avatar--fallback">
                        {partner.alias.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {unreadCount > 0 && (
                      <span
                        className="chats-tab__unread-badge"
                        aria-label={`${unreadCount} mensajes no leídos`}
                      >
                        {formatUnreadCount(unreadCount)}
                      </span>
                    )}
                  </div>

                  <div className="chats-tab__item-body">
                    <div className="chats-tab__item-top">
                      <strong>{partner.alias}</strong>
                      <span>{formatChatDate(getChatActivityDate(chatWithPreview))}</span>
                    </div>
                    <p>
                      {previewText ?? 'Nueva conversación · Toca para abrir'}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ChatsTab
