import type { Usuario } from '../../../models'

export function isProfileComplete(profile: Partial<Usuario>): boolean {
  return Boolean(profile.alias && profile.pais && profile.idioma && profile.rol_enum)
}
