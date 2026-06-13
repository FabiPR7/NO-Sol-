import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import { USUARIO_INTERES_COLLECTION } from '../../../models'

export async function hasUserInterests(userId: string): Promise<boolean> {
  const userInterestsQuery = query(
    collection(db, USUARIO_INTERES_COLLECTION),
    where('usuario_id', '==', userId),
  )

  const snapshot = await getDocs(userInterestsQuery)
  return !snapshot.empty
}
