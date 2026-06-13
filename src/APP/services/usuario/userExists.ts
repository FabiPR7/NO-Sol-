import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { USERS_COLLECTION } from '../../../models'

export async function userExists(userId: string): Promise<boolean> {
  const userRef = doc(db, USERS_COLLECTION, userId)
  const snapshot = await getDoc(userRef)
  return snapshot.exists()
}
