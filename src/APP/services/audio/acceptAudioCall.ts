import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { AUDIO_SESSIONS_COLLECTION } from '../../../models'

export async function acceptAudioCall(sessionId: string): Promise<void> {
  await updateDoc(doc(db, AUDIO_SESSIONS_COLLECTION, sessionId), {
    llamada_aceptada: true,
  })
}
