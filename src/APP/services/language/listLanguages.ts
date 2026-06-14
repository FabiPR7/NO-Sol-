import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../../firebase'
import { LANGUAGE_COLLECTION, type Language } from '../../../models'

export async function listLanguages(): Promise<Language[]> {
  const snapshot = await getDocs(collection(db, LANGUAGE_COLLECTION))

  return snapshot.docs
    .map((document) => ({
      id: document.id,
      nombre: document.data().nombre as string,
    }))
    .filter((language) => language.nombre)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
