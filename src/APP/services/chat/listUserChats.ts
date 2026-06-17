import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../../firebase'
import { CHATS_COLLECTION, type Chat } from '../../../models'
import { mapChatDocument } from '../match/mapChatDocument'
import { subscribeToHiddenChatIds } from '../moderation/hideChat'

function mapChatsFromSnapshot(
  docs: { id: string; data: () => Record<string, unknown> }[],
): Chat[] {
  return docs
    .map((document) => mapChatDocument(document.id, document.data()))
    .sort(
      (a, b) =>
        (b.ultimo_mensaje_en ?? b.creado_en).getTime() -
        (a.ultimo_mensaje_en ?? a.creado_en).getTime(),
    )
}

function filterVisibleChats(chats: Chat[], hiddenChatIds: Set<string>): Chat[] {
  return chats.filter((chat) => !hiddenChatIds.has(chat.id))
}

export async function listUserChats(userId: string): Promise<Chat[]> {
  const snapshot = await getDocs(
    query(
      collection(db, CHATS_COLLECTION),
      where('participante_ids', 'array-contains', userId),
      where('activo', '==', true),
    ),
  )

  return mapChatsFromSnapshot(snapshot.docs)
}

export function subscribeToUserChats(
  userId: string,
  onChats: (chats: Chat[]) => void,
  onError?: (error: Error) => void,
): () => void {
  let latestChats: Chat[] = []
  let hiddenChatIds = new Set<string>()

  const emit = () => {
    onChats(filterVisibleChats(latestChats, hiddenChatIds))
  }

  const unsubscribeChats = onSnapshot(
    query(
      collection(db, CHATS_COLLECTION),
      where('participante_ids', 'array-contains', userId),
      where('activo', '==', true),
    ),
    (snapshot) => {
      latestChats = mapChatsFromSnapshot(snapshot.docs)
      emit()
    },
    (error) => onError?.(error),
  )

  const unsubscribeHidden = subscribeToHiddenChatIds(
    userId,
    (nextHiddenChatIds) => {
      hiddenChatIds = nextHiddenChatIds
      emit()
    },
    onError,
  )

  return () => {
    unsubscribeChats()
    unsubscribeHidden()
  }
}
