import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../../firebase'
import { MATCH_QUEUE_COLLECTION, type MatchModo } from '../../../models'
import { attemptMatch, getMatchResultCollection } from './attemptMatch'

export function listenForMatch(
  userId: string,
  esMenor: boolean,
  modo: MatchModo,
  searchStartedAt: number,
  onMatched: (sessionId: string) => void,
  onError?: (error: Error) => void,
): () => void {
  let stopped = false
  const resultCollection = getMatchResultCollection(modo)

  const tryMatch = async () => {
    if (stopped) return

    const sessionId = await attemptMatch(userId)
    if (sessionId && !stopped) {
      onMatched(sessionId)
    }
  }

  const unsubscribeQueue = onSnapshot(
    query(
      collection(db, MATCH_QUEUE_COLLECTION),
      where('es_menor', '==', esMenor),
      where('modo', '==', modo),
    ),
    () => {
      void tryMatch()
    },
    (error) => onError?.(error),
  )

  const unsubscribeSessions = onSnapshot(
    query(
      collection(db, resultCollection),
      where('participante_ids', 'array-contains', userId),
      where('activo', '==', true),
    ),
    (snapshot) => {
      const recentSession = snapshot.docs
        .map((document) => ({
          id: document.id,
          createdAt:
            (document.data().creado_en as { toDate?: () => Date })?.toDate?.()?.getTime() ??
            0,
        }))
        .filter((session) => session.createdAt >= searchStartedAt - 3000)
        .sort((a, b) => b.createdAt - a.createdAt)[0]

      if (recentSession && !stopped) {
        onMatched(recentSession.id)
      }
    },
    (error) => onError?.(error),
  )

  void tryMatch()

  return () => {
    stopped = true
    unsubscribeQueue()
    unsubscribeSessions()
  }
}
