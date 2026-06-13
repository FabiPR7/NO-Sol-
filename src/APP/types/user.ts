export type AuthMode = 'login' | 'register'

export type AppUser = {
  uid: string
  name: string | null
  email: string
  picture: string | null
}
