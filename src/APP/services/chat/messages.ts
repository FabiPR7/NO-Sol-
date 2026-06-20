import {
  collection,
  doc,
  getDoc,
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
  HIDDEN_CHATS_SUBCOLLECTION,
  USERS_COLLECTION,
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

function getPartnerIdFromChatData(
  participanteIds: string[],
  senderId: string,
): string | null {
  const partnerId = participanteIds.find((id) => id !== senderId)
  return partnerId ?? null
}

export async function sendMessage(
  chatId: string,
  message: ChatMessageInput,
  partnerId?: string,
): Promise<void> {
  const chatRef = doc(db, CHATS_COLLECTION, chatId)
  const chatSnapshot = await getDoc(chatRef)

  if (!chatSnapshot.exists()) {
    throw new Error('No se encontró la conversación.')
  }

  const chatData = chatSnapshot.data()
  const participanteIds = chatData.participante_ids as string[]
  const recipientId =
    partnerId ?? getPartnerIdFromChatData(participanteIds, message.emisor_id)

  if (recipientId) {
    const blocked = await isChatBlockedBetween(message.emisor_id, recipientId)

    if (blocked) {
      throw new ChatBlockedError()
    }
  }

  const messageRef = doc(collection(db, CHATS_COLLECTION, chatId, CHAT_MESSAGES_COLLECTION))
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
    activo: true,
    ultimo_mensaje_tipo: message.tipo,
    ultimo_mensaje_contenido: message.contenido ?? '',
    ultimo_mensaje_emisor_id: message.emisor_id,
    ultimo_mensaje_en: serverTimestamp(),
  })

  if (recipientId) {
    batch.delete(
      doc(db, USERS_COLLECTION, recipientId, HIDDEN_CHATS_SUBCOLLECTION, chatId),
    )
  }

  batch.delete(
    doc(db, USERS_COLLECTION, message.emisor_id, HIDDEN_CHATS_SUBCOLLECTION, chatId),
  )

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
