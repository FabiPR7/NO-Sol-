import type { FiltroCualquiera, FiltroSexo, RolUsuario, SexoUsuario } from './Usuario'

export const MATCH_QUEUE_COLLECTION = 'match_queue'

export const ADULT_AGE_THRESHOLD = 18

export type MatchModo = 'chat' | 'video' | 'audio'

export interface MatchQueueEntry {
  usuario_id: string
  alias: string
  foto_url: string
  descripcion?: string
  rol_enum: RolUsuario
  edad: number
  es_menor: boolean
  sexo: SexoUsuario
  pais: string
  interes_ids: string[]
  language_ids: string[]
  filtro_sexo: FiltroSexo
  filtro_pais: string | FiltroCualquiera
  filtro_language_id: string | FiltroCualquiera
  modo: MatchModo
}

export type MatchQueueEntryInput = MatchQueueEntry

export function isMinorAge(edad: number): boolean {
  return edad < ADULT_AGE_THRESHOLD
}

export interface MatchCandidate extends MatchQueueEntry {
  id: string
}

export interface MatchFilters {
  filtro_sexo: FiltroSexo
  filtro_pais: string | FiltroCualquiera
  filtro_language_id: string | FiltroCualquiera
}

export interface MatchProfile {
  sexo: SexoUsuario
  pais: string
  language_ids: string[]
}

export function passesFilters(
  candidate: MatchProfile,
  filters: MatchFilters,
): boolean {
  if (filters.filtro_sexo !== 'cualquiera' && candidate.sexo !== filters.filtro_sexo) {
    return false
  }

  if (filters.filtro_pais !== 'cualquiera' && candidate.pais !== filters.filtro_pais) {
    return false
  }

  if (
    filters.filtro_language_id !== 'cualquiera' &&
    !candidate.language_ids.includes(filters.filtro_language_id)
  ) {
    return false
  }

  return true
}

export function areRolesCompatible(
  rolA: RolUsuario,
  rolB: RolUsuario,
): boolean {
  return rolA !== rolB
}

export function areAgeGroupsCompatible(edadA: number, edadB: number): boolean {
  return isMinorAge(edadA) === isMinorAge(edadB)
}

export function areUsersCompatible(
  seeker: MatchQueueEntry,
  candidate: MatchQueueEntry,
): boolean {
  if (seeker.usuario_id === candidate.usuario_id) {
    return false
  }

  const seekerModo = seeker.modo ?? 'chat'
  const candidateModo = candidate.modo ?? 'chat'

  if (seekerModo !== candidateModo) {
    return false
  }

  if (!areRolesCompatible(seeker.rol_enum, candidate.rol_enum)) {
    return false
  }

  if (!areAgeGroupsCompatible(seeker.edad, candidate.edad)) {
    return false
  }

  if (
    !passesFilters(
      {
        sexo: candidate.sexo,
        pais: candidate.pais,
        language_ids: candidate.language_ids,
      },
      {
        filtro_sexo: seeker.filtro_sexo,
        filtro_pais: seeker.filtro_pais,
        filtro_language_id: seeker.filtro_language_id,
      },
    )
  ) {
    return false
  }

  if (
    !passesFilters(
      {
        sexo: seeker.sexo,
        pais: seeker.pais,
        language_ids: seeker.language_ids,
      },
      {
        filtro_sexo: candidate.filtro_sexo,
        filtro_pais: candidate.filtro_pais,
        filtro_language_id: candidate.filtro_language_id,
      },
    )
  ) {
    return false
  }

  return true
}

export function countSharedInterests(
  interestIdsA: string[],
  interestIdsB: string[],
): number {
  const setB = new Set(interestIdsB)
  return interestIdsA.filter((id) => setB.has(id)).length
}

export function pickBestCandidate(
  seeker: MatchQueueEntry,
  candidates: MatchQueueEntry[],
): MatchQueueEntry | null {
  const compatible = candidates.filter((candidate) =>
    areUsersCompatible(seeker, candidate),
  )

  if (compatible.length === 0) {
    return null
  }

  return compatible
    .map((candidate) => ({
      candidate,
      score: countSharedInterests(seeker.interes_ids, candidate.interes_ids),
    }))
    .sort((a, b) => b.score - a.score)[0].candidate
}
