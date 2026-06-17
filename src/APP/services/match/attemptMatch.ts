import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import {
  CHATS_COLLECTION,
  MATCH_QUEUE_COLLECTION,
  pickBestCandidate,
  VIDEO_SESSIONS_COLLECTION,
  type ChatData,
  type MatchModo,
  type MatchQueueEntry,
  type MatchQueueEntryInput,
  type VideoSessionData,
} from '../../../models'

function toMatchQueueEntry(
  id: string,
  data: MatchQueueEntryInput,
): MatchQueueEntry {
  return {
    ...data,
    usuario_id: id,
    modo: data.modo ?? 'chat',
  }
}

function buildSessionData(
  userId: string,
  seeker: MatchQueueEntry,
  partner: MatchQueueEntry,
): VideoSessionData | ChatData {
  return {
    participante_ids: [userId, partner.usuario_id].sort() as [string, string],
    participante_1_id: userId,
    participante_2_id: partner.usuario_id,
    participante_1_alias: seeker.alias,
    participante_2_alias: partner.alias,
    participante_1_foto: seeker.foto_url,
    participante_2_foto: partner.foto_url,
    activo: true,
  }
}

export async function attemptMatch(userId: string): Promise<string | null> {
  const myRef = doc(db, MATCH_QUEUE_COLLECTION, userId)
  const myDoc = await getDoc(myRef)

  if (!myDoc.exists()) {
    return null
  }

  const seeker = toMatchQueueEntry(userId, myDoc.data() as MatchQueueEntryInput)

  const candidatesSnapshot = await getDocs(
    query(
      collection(db, MATCH_QUEUE_COLLECTION),
      where('es_menor', '==', seeker.es_menor),
      where('modo', '==', seeker.modo),
    ),
  )

  const candidates = candidatesSnapshot.docs
    .map((document) =>
      toMatchQueueEntry(document.id, document.data() as MatchQueueEntryInput),
    )
    .filter((candidate) => candidate.usuario_id !== userId)

  const best = pickBestCandidate(seeker, candidates)

  if (!best) {
    return null
  }

  const partnerRef = doc(db, MATCH_QUEUE_COLLECTION, best.usuario_id)
  const sessionRef = doc(
    collection(
      db,
      seeker.modo === 'video' ? VIDEO_SESSIONS_COLLECTION : CHATS_COLLECTION,
    ),
  )

  try {
    return await runTransaction(db, async (transaction) => {
      const currentDoc = await transaction.get(myRef)
      const partnerDoc = await transaction.get(partnerRef)

      if (!currentDoc.exists() || !partnerDoc.exists()) {
        return null
      }

      const sessionData = buildSessionData(userId, seeker, best)

      transaction.set(sessionRef, {
        ...sessionData,
        creado_en: serverTimestamp(),
      })
      transaction.delete(myRef)
      transaction.delete(partnerRef)

      return sessionRef.id
    })
  } catch {
    return null
  }
}

export function getMatchResultCollection(modo: MatchModo): string {
  return modo === 'video' ? VIDEO_SESSIONS_COLLECTION : CHATS_COLLECTION
}
