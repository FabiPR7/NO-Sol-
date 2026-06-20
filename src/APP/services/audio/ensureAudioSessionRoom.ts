import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { AUDIO_SESSIONS_COLLECTION } from '../../../models'
import { getOrCreateDailyRoomUrl } from '../video/dailyApi'

export async function ensureAudioSessionRoom(sessionId: string): Promise<string> {
  const sessionRef = doc(db, AUDIO_SESSIONS_COLLECTION, sessionId)
  const snapshot = await getDoc(sessionRef)

  if (!snapshot.exists()) {
    throw new Error('No se encontró la sesión de llamada.')
  }

  const existingUrl = snapshot.data().daily_room_url as string | undefined

  if (existingUrl) {
    return existingUrl
  }

  const roomUrl = await getOrCreateDailyRoomUrl(sessionId, 'audio')

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
