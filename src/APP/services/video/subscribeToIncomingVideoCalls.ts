import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../../firebase'
import { VIDEO_SESSIONS_COLLECTION, type VideoSession } from '../../../models'
import { isIncomingChatVideoCall } from './createVideoSessionFromChat'
import { mapVideoSessionDocument } from './mapVideoSessionDocument'

export function subscribeToIncomingVideoCalls(
  userId: string,
  onIncoming: (session: VideoSession) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, VIDEO_SESSIONS_COLLECTION),
      where('participante_ids', 'array-contains', userId),
      where('activo', '==', true),
    ),
    (snapshot) => {
      const incoming = snapshot.docs
        .map((document) => mapVideoSessionDocument(document.id, document.data()))
        .filter((session) => isIncomingChatVideoCall(session, userId))
        .sort((a, b) => b.creado_en.getTime() - a.creado_en.getTime())

      if (incoming[0]) {
        onIncoming(incoming[0])
      }
    },
    (error) => onError?.(error),
  )
}
