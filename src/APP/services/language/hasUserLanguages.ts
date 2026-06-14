import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../../firebase'
import { LANGUAGE_USER_COLLECTION } from '../../../models'

export async function hasUserLanguages(userId: string): Promise<boolean> {
  const userLanguagesQuery = query(
    collection(db, LANGUAGE_USER_COLLECTION),
    where('usuario_id', '==', userId),
  )

  const snapshot = await getDocs(userLanguagesQuery)
  return !snapshot.empty
}
