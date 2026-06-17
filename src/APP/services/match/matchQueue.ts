import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import {
  isMinorAge,
  MATCH_QUEUE_COLLECTION,
  type MatchModo,
  type MatchQueueEntryInput,
  type Usuario,
} from '../../../models'
import { getUserInterests } from '../interes/getUserInterests'
import { getUserLanguages } from '../language/getUserLanguages'

export async function buildMatchQueueEntry(
  userId: string,
  profile: Partial<Usuario>,
  modo: MatchModo = 'chat',
): Promise<MatchQueueEntryInput> {
  const [interests, languages] = await Promise.all([
    getUserInterests(userId),
    getUserLanguages(userId),
  ])

  const edad = profile.edad ?? 18

  return {
    usuario_id: userId,
    alias: profile.alias ?? 'Usuario',
    foto_url: profile.foto_url ?? '',
    rol_enum: profile.rol_enum!,
    edad,
    es_menor: isMinorAge(edad),
    sexo: profile.sexo!,
    pais: profile.pais ?? '',
    interes_ids: interests.map((interes) => interes.id),
    language_ids: languages.map((language) => language.id),
    filtro_sexo: profile.filtro_sexo ?? 'cualquiera',
    filtro_pais: profile.filtro_pais ?? 'cualquiera',
    filtro_language_id: profile.filtro_language_id ?? 'cualquiera',
    modo,
  }
}

export async function joinMatchQueue(
  userId: string,
  profile: Partial<Usuario>,
  modo: MatchModo = 'chat',
): Promise<MatchQueueEntryInput> {
  const entry = await buildMatchQueueEntry(userId, profile, modo)

  await setDoc(doc(db, MATCH_QUEUE_COLLECTION, userId), {
    ...entry,
    buscando_desde: serverTimestamp(),
  })

  return entry
}

export async function leaveMatchQueue(userId: string): Promise<void> {
  await deleteDoc(doc(db, MATCH_QUEUE_COLLECTION, userId))
}

export async function getMatchQueueEntry(
  userId: string,
): Promise<MatchQueueEntryInput | null> {
  const snapshot = await getDoc(doc(db, MATCH_QUEUE_COLLECTION, userId))

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as MatchQueueEntryInput
}
