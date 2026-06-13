import { useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth } from '../../firebase'
import { loginUser, registerUser } from '../services/usuario'
import type { AppUser, AuthMode } from '../types/user'

function mapFirebaseUser(user: User): AppUser {
  return {
    uid: user.uid,
    name: user.displayName,
    email: user.email ?? '',
    picture: user.photoURL,
  }
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null)
      setLoading(false)
    })
  }, [])

  const loginWithGoogle = useCallback(async (mode: AuthMode) => {
    if (mode === 'login') {
      await loginUser()
      return
    }

    await registerUser()
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  return { user, loading, loginWithGoogle, logout }
}
