import type { Usuario } from '../../../models'

export function isProfileComplete(profile: Partial<Usuario>): boolean {
  return Boolean(
    profile.alias &&
      profile.pais &&
      profile.rol_enum &&
      profile.sexo &&
      typeof profile.edad === 'number' &&
      profile.edad >= 16 &&
      profile.edad <= 120,
  )
}
