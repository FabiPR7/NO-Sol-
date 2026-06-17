import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import {
  CHAT_MESSAGES_COLLECTION,
  CHATS_COLLECTION,
  type ChatMessageTipo,
} from '../../../models'
import type { ChatLastMessagePreview } from './chatPreview'

function mapMessageTipo(value: unknown): ChatMessageTipo {
  if (value === 'imagen' || value === 'audio' || value === 'texto') {
    return value
  }

  return 'texto'
}

export function subscribeToLastMessagePreview(
  chatId: string,
  onPreview: (preview: ChatLastMessagePreview | null) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, CHATS_COLLECTION, chatId, CHAT_MESSAGES_COLLECTION),
      orderBy('enviado_en', 'desc'),
      limit(1),
    ),
    (snapshot) => {
      const document = snapshot.docs[0]

      if (!document) {
        onPreview(null)
        return
      }

      const data = document.data()

      onPreview({
        ultimo_mensaje_tipo: mapMessageTipo(data.tipo),
        ultimo_mensaje_contenido: (data.contenido as string) ?? '',
        ultimo_mensaje_emisor_id: data.emisor_id as string,
        ultimo_mensaje_en:
          (data.enviado_en as { toDate?: () => Date })?.toDate?.() ?? new Date(),
      })
    },
    (error) => onError?.(error),
  )
}

export function subscribeToMissingLastMessagePreviews(
  chatIds: string[],
  onPreview: (chatId: string, preview: ChatLastMessagePreview | null) => void,
  onError?: (error: Error) => void,
): () => void {
  const unsubscribers = chatIds.map((chatId) =>
    subscribeToLastMessagePreview(
      chatId,
      (preview) => onPreview(chatId, preview),
      onError,
    ),
  )

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe())
  }
}
