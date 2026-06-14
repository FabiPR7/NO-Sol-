import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../../../firebase'
import type { Interes } from '../../../models'
import { USUARIO_INTERES_COLLECTION } from '../../../models'
import { listInterests } from './listInterests'

export async function getUserInterests(userId: string): Promise<Interes[]> {
  const userInterestsQuery = query(
    collection(db, USUARIO_INTERES_COLLECTION),
    where('usuario_id', '==', userId),
  )

  const snapshot = await getDocs(userInterestsQuery)
  const interestIds = snapshot.docs.map(
    (document) => document.data().interes_id as string,
  )

  if (interestIds.length === 0) {
    return []
  }

  const allInterests = await listInterests()
  return allInterests.filter((interes) => interestIds.includes(interes.id))
}
