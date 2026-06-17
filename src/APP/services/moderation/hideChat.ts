import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { HIDDEN_CHATS_SUBCOLLECTION, USERS_COLLECTION } from '../../../models'

export async function hideChatForUser(userId: string, chatId: string): Promise<void> {
  await setDoc(doc(db, USERS_COLLECTION, userId, HIDDEN_CHATS_SUBCOLLECTION, chatId), {
    chat_id: chatId,
    oculto_en: serverTimestamp(),
  })
}

export function subscribeToHiddenChatIds(
  userId: string,
  onHiddenChatIds: (chatIds: Set<string>) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, USERS_COLLECTION, userId, HIDDEN_CHATS_SUBCOLLECTION),
    (snapshot) => {
      onHiddenChatIds(new Set(snapshot.docs.map((document) => document.id)))
    },
    (error) => onError?.(error),
  )
}
