import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { VIDEO_SESSIONS_COLLECTION } from '../../../models'
import { getOrCreateDailyRoomUrl } from './dailyApi'

export async function ensureVideoSessionRoom(sessionId: string): Promise<string> {
  const sessionRef = doc(db, VIDEO_SESSIONS_COLLECTION, sessionId)
  const snapshot = await getDoc(sessionRef)

  if (!snapshot.exists()) {
    throw new Error('No se encontró la sesión de videollamada.')
  }

  const existingUrl = snapshot.data().daily_room_url as string | undefined

  if (existingUrl) {
    return existingUrl
  }

  const roomUrl = await getOrCreateDailyRoomUrl(sessionId)

  try {
    await setDoc(sessionRef, { daily_room_url: roomUrl }, { merge: true })
  } catch {
    const latestSnapshot = await getDoc(sessionRef)
    const latestUrl = latestSnapshot.data()?.daily_room_url as string | undefined

    if (latestUrl) {
      return latestUrl
    }
  }

  return roomUrl
}
