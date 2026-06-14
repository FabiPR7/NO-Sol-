import type { Usuario } from '../../models'
import type { AppUser } from '../types/user'

export function getProfilePhotoUrl(
  profile: Partial<Usuario> | null | undefined,
  user: AppUser,
): string | null {
  return profile?.foto_url || user.picture || null
}
