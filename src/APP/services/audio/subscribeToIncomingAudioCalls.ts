import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../../firebase'
import { AUDIO_SESSIONS_COLLECTION, type AudioSession } from '../../../models'
import { isIncomingChatAudioCall } from './createAudioSessionFromChat'
import { mapAudioSessionDocument } from './mapAudioSessionDocument'

export function subscribeToIncomingAudioCalls(
  userId: string,
  onIncoming: (session: AudioSession) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db, AUDIO_SESSIONS_COLLECTION),
      where('participante_ids', 'array-contains', userId),
      where('activo', '==', true),
    ),
    (snapshot) => {
      const incoming = snapshot.docs
        .map((document) => mapAudioSessionDocument(document.id, document.data()))
        .filter((session) => isIncomingChatAudioCall(session, userId))
        .sort((a, b) => b.creado_en.getTime() - a.creado_en.getTime())

      if (incoming[0]) {
        onIncoming(incoming[0])
      }
    },
    (error) => onError?.(error),
  )
}
