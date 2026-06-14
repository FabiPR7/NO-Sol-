import { useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth } from '../../firebase'
import type { Usuario, UsuarioPerfilInput } from '../../models'
import { hasUserLanguages, saveUserLanguages } from '../services/language'
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
  const [languagesComplete, setLanguagesComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)

  const loadProfile = useCallback(async (uid: string) => {
    setProfileLoading(true)

    const [data, hasInterests, hasLanguages] = await Promise.all([
      getUserProfile(uid),
      hasUserInterests(uid),
      hasUserLanguages(uid),
    ])

    setProfile(data)
    setInterestsComplete(hasInterests)
    setLanguagesComplete(hasLanguages)
    setProfileLoading(false)
  }, [])

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null)

      if (!firebaseUser) {
        setProfile(null)
        setInterestsComplete(false)
        setLanguagesComplete(false)
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
    async (
      input: Omit<UsuarioPerfilInput, 'foto_url'> & { foto_url?: string },
    ) => {
      if (!user) return

      await saveUserProfile(user.uid, user.email, {
        ...input,
        foto_url: input.foto_url ?? user.picture ?? '',
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
    },
    [user],
  )

  const completeLanguages = useCallback(
    async (languageIds: string[]) => {
      if (!user) return

      await saveUserLanguages(user.uid, languageIds)
      setLanguagesComplete(true)
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
  const needsLanguagesSetup = Boolean(
    user && justRegistered && profileComplete && interestsComplete && !languagesComplete,
  )

  const reloadProfile = useCallback(async () => {
    if (!user) return
    await loadProfile(user.uid)
  }, [user, loadProfile])

  return {
    user,
    profile,
    loading,
    profileLoading,
    profileComplete,
    interestsComplete,
    languagesComplete,
    needsProfileSetup,
    needsInterestsSetup,
    needsLanguagesSetup,
    loginWithGoogle,
    completeProfile,
    completeInterests,
    completeLanguages,
    reloadProfile,
    logout,
  }
}
