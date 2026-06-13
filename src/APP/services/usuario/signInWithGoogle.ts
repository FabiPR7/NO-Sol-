import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth'
import { auth } from '../../../firebase'

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  const result = await signInWithPopup(auth, provider)

  if (!result.user.email) {
    throw new Error('Google no devolvió un correo electrónico válido.')
  }

  return result.user
}
