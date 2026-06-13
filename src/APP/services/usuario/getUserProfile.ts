import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { USERS_COLLECTION, type Usuario } from '../../../models'

export async function getUserProfile(userId: string): Promise<Partial<Usuario>> {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId))

  if (!snapshot.exists()) {
    return {}
  }

  return snapshot.data() as Partial<Usuario>
}
