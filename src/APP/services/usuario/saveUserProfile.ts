import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../../firebase'
import { USERS_COLLECTION, type UsuarioPerfilInput } from '../../../models'

export async function saveUserProfile(
  userId: string,
  email: string,
  profile: UsuarioPerfilInput,
): Promise<void> {
  await setDoc(
    doc(db, USERS_COLLECTION, userId),
    {
      email,
      alias: profile.alias,
      foto_url: profile.foto_url,
      rol_enum: profile.rol_enum,
      pais: profile.pais,
      edad: profile.edad,
      sexo: profile.sexo,
      filtro_sexo: 'cualquiera',
      filtro_pais: 'cualquiera',
      filtro_language_id: 'cualquiera',
      creado_en: serverTimestamp(),
    },
    { merge: true },
  )
}
