import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../../firebase'
import { LANGUAGE_USER_COLLECTION, type Language } from '../../../models'
import { listLanguages } from './listLanguages'

export async function getUserLanguages(userId: string): Promise<Language[]> {
  const userLanguagesQuery = query(
    collection(db, LANGUAGE_USER_COLLECTION),
    where('usuario_id', '==', userId),
  )

  const snapshot = await getDocs(userLanguagesQuery)
  const languageIds = snapshot.docs.map(
    (document) => document.data().language_id as string,
  )

  if (languageIds.length === 0) {
    return []
  }

  const allLanguages = await listLanguages()
  return allLanguages.filter((language) => languageIds.includes(language.id))
}
