import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { VIDEO_SESSIONS_COLLECTION } from '../../../models'

export async function acceptVideoCall(sessionId: string): Promise<void> {
  await updateDoc(doc(db, VIDEO_SESSIONS_COLLECTION, sessionId), {
    llamada_aceptada: true,
  })
}
