import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import {
  CHAT_MESSAGES_COLLECTION,
  CHATS_COLLECTION,
  type ChatMessage,
  type ChatMessageInput,
  type ChatMessageTipo,
} from '../../../models'
import { isChatBlockedBetween, ChatBlockedError } from '../moderation'

function mapMessageTipo(value: unknown): ChatMessageTipo {
  if (value === 'imagen' || value === 'audio' || value === 'texto') {
    return value
  }

  return 'texto'
}

export async function sendMessage(
  chatId: string,
  message: ChatMessageInput,
  partnerId?: string,
): Promise<void> {
  if (partnerId) {
    const blocked = await isChatBlockedBetween(message.emisor_id, partnerId)

    if (blocked) {
      throw new ChatBlockedError()
    }
  }

  const messageRef = doc(collection(db, CHATS_COLLECTION, chatId, CHAT_MESSAGES_COLLECTION))
  const chatRef = doc(db, CHATS_COLLECTION, chatId)
  const batch = writeBatch(db)

  batch.set(messageRef, {
    emisor_id: message.emisor_id,
    tipo: message.tipo,
    contenido: message.contenido ?? '',
    ...(message.media_url ? { media_url: message.media_url } : {}),
    leido: false,
    enviado_en: serverTimestamp(),
  })

  batch.update(chatRef, {
    ultimo_mensaje_tipo: message.tipo,
    ultimo_mensaje_contenido: message.contenido ?? '',
    ultimo_mensaje_emisor_id: message.emisor_id,
    ultimo_mensaje_en: serverTimestamp(),
  })

  await batch.commit()
}

export function subscribeToMessages(
  chatId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, CHATS_COLLECTION, chatId, CHAT_MESSAGES_COLLECTION),
      orderBy('enviado_en', 'asc'),
    ),
    (snapshot) => {
      const messages = snapshot.docs.map((document) => {
        const data = document.data()

        return {
          id: document.id,
          emisor_id: data.emisor_id as string,
          tipo: mapMessageTipo(data.tipo),
          contenido: (data.contenido as string) ?? '',
          media_url: (data.media_url as string | undefined) ?? undefined,
          leido: Boolean(data.leido),
          enviado_en:
            (data.enviado_en as { toDate?: () => Date })?.toDate?.() ?? new Date(),
        }
      })

      onMessages(messages)
    },
    (error) => onError?.(error),
  )
}
