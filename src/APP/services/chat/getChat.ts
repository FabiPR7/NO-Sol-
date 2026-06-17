import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { CHATS_COLLECTION, type Chat } from '../../../models'
import { mapChatDocument } from '../match/mapChatDocument'

export async function getChat(chatId: string): Promise<Chat | null> {
  const snapshot = await getDoc(doc(db, CHATS_COLLECTION, chatId))

  if (!snapshot.exists()) {
    return null
  }

  return mapChatDocument(snapshot.id, snapshot.data())
}
