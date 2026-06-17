import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { VIDEO_SESSIONS_COLLECTION, type VideoSession } from '../../../models'
import { mapVideoSessionDocument } from './mapVideoSessionDocument'

export async function getVideoSession(sessionId: string): Promise<VideoSession | null> {
  const snapshot = await getDoc(doc(db, VIDEO_SESSIONS_COLLECTION, sessionId))

  if (!snapshot.exists()) {
    return null
  }

  return mapVideoSessionDocument(snapshot.id, snapshot.data())
}

export async function endVideoSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, VIDEO_SESSIONS_COLLECTION, sessionId), {
    activo: false,
  })
}
