import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../../firebase'
import { INTERESTS_COLLECTION, type Interes } from '../../../models'

export async function listInterests(): Promise<Interes[]> {
  const snapshot = await getDocs(collection(db, INTERESTS_COLLECTION))

  return snapshot.docs
    .map((document) => ({
      id: document.id,
      nombre: document.data().nombre as string,
    }))
    .filter((interes) => interes.nombre)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
