import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import {
  CHATS_COLLECTION,
  CHAT_TYPING_COLLECTION,
  TYPING_STALE_MS,
} from '../../../models'

function typingDocRef(chatId: string, userId: string) {
  return doc(db, CHATS_COLLECTION, chatId, CHAT_TYPING_COLLECTION, userId)
}

export async function setTypingStatus(
  chatId: string,
  userId: string,
  escribiendo: boolean,
): Promise<void> {
  const ref = typingDocRef(chatId, userId)

  if (!escribiendo) {
    try {
      await deleteDoc(ref)
    } catch {
      /* El documento puede no existir */
    }
    return
  }

  await setDoc(
    ref,
    {
      escribiendo: true,
      actualizado_en: serverTimestamp(),
    },
    { merge: true },
  )
}

export function subscribeToPartnerTyping(
  chatId: string,
  partnerId: string,
  onTyping: (escribiendo: boolean) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    typingDocRef(chatId, partnerId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onTyping(false)
        return
      }

      const data = snapshot.data()
      const escribiendo = Boolean(data.escribiendo)
      const updatedAt =
        (data.actualizado_en as { toDate?: () => Date })?.toDate?.()?.getTime() ?? 0
      const isFresh = Date.now() - updatedAt <= TYPING_STALE_MS

      onTyping(escribiendo && isFresh)
    },
    (error) => onError?.(error),
  )
}
