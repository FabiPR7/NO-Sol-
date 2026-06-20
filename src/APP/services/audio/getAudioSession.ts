import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { AUDIO_SESSIONS_COLLECTION, type AudioSession } from '../../../models'
import { mapAudioSessionDocument } from './mapAudioSessionDocument'

export async function getAudioSession(sessionId: string): Promise<AudioSession | null> {
  const snapshot = await getDoc(doc(db, AUDIO_SESSIONS_COLLECTION, sessionId))

  if (!snapshot.exists()) {
    return null
  }

  return mapAudioSessionDocument(snapshot.id, snapshot.data())
}

export function subscribeToAudioSession(
  sessionId: string,
  onUpdate: (session: AudioSession | null) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, AUDIO_SESSIONS_COLLECTION, sessionId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null)
        return
      }

      onUpdate(mapAudioSessionDocument(snapshot.id, snapshot.data()))
    },
    (error) => onError?.(error),
  )
}

export async function endAudioSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, AUDIO_SESSIONS_COLLECTION, sessionId), {
    activo: false,
  })
}
