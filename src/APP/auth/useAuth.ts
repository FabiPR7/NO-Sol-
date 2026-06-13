import { useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth } from '../../firebase'
import type { Usuario, UsuarioPerfilInput } from '../../models'
import { hasUserInterests, saveUserInterests } from '../services/interes'
import {
  getUserProfile,
  isProfileComplete,
  loginUser,
  registerUser,
  saveUserProfile,
} from '../services/usuario'
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
  const [profile, setProfile] = useState<Partial<Usuario> | null>(null)
  const [interestsComplete, setInterestsComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)

  const loadProfile = useCallback(async (uid: string) => {
    setProfileLoading(true)

    const [data, hasInterests] = await Promise.all([
      getUserProfile(uid),
      hasUserInterests(uid),
    ])

    setProfile(data)
    setInterestsComplete(hasInterests)
    setProfileLoading(false)
  }, [])

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null)

      if (!firebaseUser) {
        setProfile(null)
        setInterestsComplete(false)
        setJustRegistered(false)
      }

      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (user) {
      loadProfile(user.uid)
    }
  }, [user, loadProfile])

  const loginWithGoogle = useCallback(async (mode: AuthMode) => {
    if (mode === 'login') {
      await loginUser()
      setJustRegistered(false)
      return
    }

    await registerUser()
    setJustRegistered(true)
  }, [])

  const completeProfile = useCallback(
    async (input: Omit<UsuarioPerfilInput, 'foto_url'>) => {
      if (!user) return

      await saveUserProfile(user.uid, user.email, {
        ...input,
        foto_url: user.picture ?? '',
      })

      await loadProfile(user.uid)
    },
    [user, loadProfile],
  )

  const completeInterests = useCallback(
    async (interestIds: string[]) => {
      if (!user) return

      await saveUserInterests(user.uid, interestIds)
      setInterestsComplete(true)
      setJustRegistered(false)
    },
    [user],
  )

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const profileComplete = profile ? isProfileComplete(profile) : false
  const needsProfileSetup = Boolean(user && justRegistered && !profileComplete)
  const needsInterestsSetup = Boolean(
    user && justRegistered && profileComplete && !interestsComplete,
  )

  return {
    user,
    profile,
    loading,
    profileLoading,
    profileComplete,
    interestsComplete,
    needsProfileSetup,
    needsInterestsSetup,
    loginWithGoogle,
    completeProfile,
    completeInterests,
    logout,
  }
}
