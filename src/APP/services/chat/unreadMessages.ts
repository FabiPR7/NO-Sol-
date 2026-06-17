import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { CHAT_MESSAGES_COLLECTION, CHATS_COLLECTION } from '../../../models'
import { subscribeToUserChats } from './listUserChats'

function countUnreadDocs(
  docs: { data: () => Record<string, unknown> }[],
  userId: string,
): number {
  return docs.filter((document) => document.data().emisor_id !== userId).length
}

export function subscribeToUnreadCount(
  chatId: string,
  userId: string,
  onCount: (count: number) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, CHATS_COLLECTION, chatId, CHAT_MESSAGES_COLLECTION),
      where('leido', '==', false),
    ),
    (snapshot) => {
      onCount(countUnreadDocs(snapshot.docs, userId))
    },
    (error) => onError?.(error),
  )
}

export function subscribeToUserUnreadCounts(
  userId: string,
  onUpdate: (counts: Record<string, number>, total: number) => void,
  onError?: (error: Error) => void,
): () => void {
  const counts: Record<string, number> = {}
  let chatUnsubscribers: Array<() => void> = []

  const emit = () => {
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
    onUpdate({ ...counts }, total)
  }

  const syncChatListeners = (chatIds: string[]) => {
    chatUnsubscribers.forEach((unsubscribe) => unsubscribe())
    chatUnsubscribers = []

    const activeChatIds = new Set(chatIds)

    Object.keys(counts).forEach((chatId) => {
      if (!activeChatIds.has(chatId)) {
        delete counts[chatId]
      }
    })

    chatIds.forEach((chatId) => {
      const unsubscribe = subscribeToUnreadCount(
        chatId,
        userId,
        (count) => {
          if (count > 0) {
            counts[chatId] = count
          } else {
            delete counts[chatId]
          }

          emit()
        },
        onError,
      )

      chatUnsubscribers.push(unsubscribe)
    })

    emit()
  }

  const unsubscribeChats = subscribeToUserChats(
    userId,
    (chats) => {
      syncChatListeners(chats.map((chat) => chat.id))
    },
    onError,
  )

  return () => {
    unsubscribeChats()
    chatUnsubscribers.forEach((unsubscribe) => unsubscribe())
  }
}

export async function markChatAsRead(chatId: string, userId: string): Promise<void> {
  const snapshot = await getDocs(
    query(
      collection(db, CHATS_COLLECTION, chatId, CHAT_MESSAGES_COLLECTION),
      where('leido', '==', false),
    ),
  )

  const unreadDocs = snapshot.docs.filter(
    (document) => document.data().emisor_id !== userId,
  )

  if (unreadDocs.length === 0) {
    return
  }

  const batchSize = 500

  for (let index = 0; index < unreadDocs.length; index += batchSize) {
    const batch = writeBatch(db)
    const chunk = unreadDocs.slice(index, index + batchSize)

    chunk.forEach((document) => {
      batch.update(document.ref, { leido: true })
    })

    await batch.commit()
  }
}

export function formatUnreadCount(count: number): string {
  if (count > 99) {
    return '99+'
  }

  return String(count)
}
