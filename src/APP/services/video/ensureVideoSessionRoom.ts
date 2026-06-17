import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { VIDEO_SESSIONS_COLLECTION } from '../../../models'
import { getOrCreateDailyRoomUrl } from './dailyApi'

export async function ensureVideoSessionRoom(sessionId: string): Promise<string> {
  const sessionRef = doc(db, VIDEO_SESSIONS_COLLECTION, sessionId)
  const snapshot = await getDoc(sessionRef)

  if (!snapshot.exists()) {
    throw new Error('SESSION_NOT_FOUND')
  }

  const existingUrl = snapshot.data().daily_room_url as string | undefined

  if (existingUrl) {
    return existingUrl
  }

  const roomUrl = await getOrCreateDailyRoomUrl(sessionId)

  try {
    await updateDoc(sessionRef, { daily_room_url: roomUrl })
  } catch {
    const latestSnapshot = await getDoc(sessionRef)
    const latestUrl = latestSnapshot.data()?.daily_room_url as string | undefined

    if (latestUrl) {
      return latestUrl
    }
  }

  return roomUrl
}
