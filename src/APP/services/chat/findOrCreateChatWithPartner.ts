import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { CHATS_COLLECTION } from '../../../models'
import { revealChatForUser } from '../moderation/hideChat'

type FindOrCreateChatInput = {
  userId: string
  userAlias: string
  userPhoto: string
  partnerId: string
  partnerAlias: string
  partnerPhoto: string
}

async function findChatIdBetweenUsers(
  userId: string,
  partnerId: string,
): Promise<string | null> {
  const snapshot = await getDocs(
    query(
      collection(db, CHATS_COLLECTION),
      where('participante_ids', 'array-contains', userId),
      where('activo', '==', true),
    ),
  )

  const existingChat = snapshot.docs.find((document) => {
    const participanteIds = document.data().participante_ids as string[]
    return participanteIds.includes(partnerId)
  })

  return existingChat?.id ?? null
}

export async function findOrCreateChatWithPartner(
  input: FindOrCreateChatInput,
): Promise<string> {
  const existingChatId = await findChatIdBetweenUsers(input.userId, input.partnerId)

  if (existingChatId) {
    await revealChatForUser(input.userId, existingChatId)
    return existingChatId
  }

  const chatRef = doc(collection(db, CHATS_COLLECTION))

  await setDoc(chatRef, {
    participante_ids: [input.userId, input.partnerId].sort() as [string, string],
    participante_1_id: input.userId,
    participante_2_id: input.partnerId,
    participante_1_alias: input.userAlias,
    participante_2_alias: input.partnerAlias,
    participante_1_foto: input.userPhoto,
    participante_2_foto: input.partnerPhoto,
    activo: true,
    creado_en: serverTimestamp(),
  })

  await revealChatForUser(input.userId, chatRef.id)

  return chatRef.id
}

export async function findChatIdWithPartner(
  userId: string,
  partnerId: string,
): Promise<string | null> {
  return findChatIdBetweenUsers(userId, partnerId)
}
