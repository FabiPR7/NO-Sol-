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
import { AUDIO_SESSIONS_COLLECTION } from '../../../models'
import { getChat } from '../chat/getChat'
import { getUserProfile } from '../usuario/getUserProfile'
import { mapAudioSessionDocument } from './mapAudioSessionDocument'

async function findActiveAudioSessionId(
  userId: string,
  partnerId: string,
): Promise<string | null> {
  const snapshot = await getDocs(
    query(
      collection(db, AUDIO_SESSIONS_COLLECTION),
      where('participante_ids', 'array-contains', userId),
      where('activo', '==', true),
    ),
  )

  const existingSession = snapshot.docs.find((document) => {
    const participanteIds = document.data().participante_ids as string[]
    return participanteIds.includes(partnerId)
  })

  return existingSession?.id ?? null
}

export async function createAudioSessionFromChat(
  chatId: string,
  callerId: string,
): Promise<string> {
  const chat = await getChat(chatId)

  if (!chat || !chat.activo) {
    throw new Error('No se encontró el chat.')
  }

  if (!chat.participante_ids.includes(callerId)) {
    throw new Error('No puedes iniciar una llamada en este chat.')
  }

  const partnerId =
    chat.participante_1_id === callerId ? chat.participante_2_id : chat.participante_1_id

  const existingSessionId = await findActiveAudioSessionId(callerId, partnerId)

  if (existingSessionId) {
    return existingSessionId
  }

  const [callerProfile, partnerProfile] = await Promise.all([
    getUserProfile(callerId),
    getUserProfile(partnerId),
  ])

  const callerDescription = callerProfile.descripcion?.trim() ?? ''
  const partnerDescription = partnerProfile.descripcion?.trim() ?? ''

  const sessionRef = doc(collection(db, AUDIO_SESSIONS_COLLECTION))

  const sessionData =
    chat.participante_1_id === callerId
      ? {
          participante_1_descripcion: callerDescription,
          participante_2_descripcion: partnerDescription,
        }
      : {
          participante_1_descripcion: partnerDescription,
          participante_2_descripcion: callerDescription,
        }

  await setDoc(sessionRef, {
    participante_ids: chat.participante_ids,
    participante_1_id: chat.participante_1_id,
    participante_2_id: chat.participante_2_id,
    participante_1_alias: chat.participante_1_alias,
    participante_2_alias: chat.participante_2_alias,
    participante_1_foto: chat.participante_1_foto,
    participante_2_foto: chat.participante_2_foto,
    ...sessionData,
    chat_id: chatId,
    iniciador_id: callerId,
    llamada_aceptada: false,
    activo: true,
    creado_en: serverTimestamp(),
  })

  return sessionRef.id
}

export function isIncomingChatAudioCall(
  session: ReturnType<typeof mapAudioSessionDocument>,
  userId: string,
): boolean {
  return Boolean(session.iniciador_id && session.iniciador_id !== userId && session.activo)
}
