import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { USER_BLOCKS_COLLECTION } from '../../../models'

export async function blockUser(
  userId: string,
  blockedUserId: string,
  chatId: string,
): Promise<void> {
  const existing = await getDocs(
    query(
      collection(db, USER_BLOCKS_COLLECTION),
      where('user_id', '==', userId),
      where('blocked_user_id', '==', blockedUserId),
    ),
  )

  if (!existing.empty) {
    return
  }

  await addDoc(collection(db, USER_BLOCKS_COLLECTION), {
    user_id: userId,
    blocked_user_id: blockedUserId,
    chat_id: chatId,
    creado_en: serverTimestamp(),
  })
}

export async function isChatBlockedBetween(
  userId: string,
  partnerId: string,
): Promise<boolean> {
  const [blockedByMe, blockedByPartner] = await Promise.all([
    getDocs(
      query(
        collection(db, USER_BLOCKS_COLLECTION),
        where('user_id', '==', userId),
        where('blocked_user_id', '==', partnerId),
      ),
    ),
    getDocs(
      query(
        collection(db, USER_BLOCKS_COLLECTION),
        where('user_id', '==', partnerId),
        where('blocked_user_id', '==', userId),
      ),
    ),
  ])

  return !blockedByMe.empty || !blockedByPartner.empty
}

export async function hasUserBlockedPartner(
  userId: string,
  partnerId: string,
): Promise<boolean> {
  const snapshot = await getDocs(
    query(
      collection(db, USER_BLOCKS_COLLECTION),
      where('user_id', '==', userId),
      where('blocked_user_id', '==', partnerId),
    ),
  )

  return !snapshot.empty
}
