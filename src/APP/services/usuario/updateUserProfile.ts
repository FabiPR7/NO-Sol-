import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { USERS_COLLECTION, type UsuarioUpdate } from '../../../models'

export type UsuarioPerfilUpdate = UsuarioUpdate

export async function updateUserProfile(
  userId: string,
  profile: UsuarioPerfilUpdate,
): Promise<void> {
  const data: UsuarioUpdate = {}

  if (profile.alias !== undefined) data.alias = profile.alias
  if (profile.pais !== undefined) data.pais = profile.pais
  if (profile.edad !== undefined) data.edad = profile.edad
  if (profile.sexo !== undefined) data.sexo = profile.sexo
  if (profile.filtro_sexo !== undefined) data.filtro_sexo = profile.filtro_sexo
  if (profile.filtro_pais !== undefined) data.filtro_pais = profile.filtro_pais
  if (profile.filtro_language_id !== undefined) {
    data.filtro_language_id = profile.filtro_language_id
  }
  if (profile.rol_enum !== undefined) data.rol_enum = profile.rol_enum
  if (profile.foto_url !== undefined) data.foto_url = profile.foto_url

  await setDoc(doc(db, USERS_COLLECTION, userId), data, { merge: true })
}
