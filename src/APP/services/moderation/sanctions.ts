import type { ModerationStatus } from '../../../models'

const DAY_MS = 24 * 60 * 60 * 1000

export function getSanctionForCastigo(castigoNum: number): {
  sancionHasta: Date | null
  expelled: boolean
} {
  if (castigoNum >= 9) {
    return { sancionHasta: null, expelled: true }
  }

  if (castigoNum >= 4 && castigoNum <= 8) {
    return { sancionHasta: new Date(Date.now() + 7 * DAY_MS), expelled: false }
  }

  if (castigoNum >= 1 && castigoNum <= 3) {
    return { sancionHasta: new Date(Date.now() + DAY_MS), expelled: false }
  }

  return { sancionHasta: null, expelled: false }
}

export function parseModerationStatus(
  profile: Record<string, unknown> | null | undefined,
): ModerationStatus {
  if (!profile) {
    return {
      type: 'none',
      sancionHasta: null,
      castigos: 0,
      denunciasRecibidas: 0,
    }
  }

  const denunciasRecibidas = Number(profile.denuncias_recibidas ?? 0)
  const castigos = Number(profile.castigos ?? 0)
  const expelled = Boolean(profile.expulsado)
  const sancionHastaRaw = profile.sancion_hasta as
    | { toDate?: () => Date }
    | Date
    | undefined

  const sancionHasta =
    sancionHastaRaw instanceof Date
      ? sancionHastaRaw
      : sancionHastaRaw?.toDate?.() ?? null

  if (expelled) {
    return {
      type: 'expelled',
      sancionHasta: null,
      castigos,
      denunciasRecibidas,
    }
  }

  if (sancionHasta && sancionHasta.getTime() > Date.now()) {
    return {
      type: 'temporary',
      sancionHasta,
      castigos,
      denunciasRecibidas,
    }
  }

  return {
    type: 'none',
    sancionHasta: null,
    castigos,
    denunciasRecibidas,
  }
}

export function formatModerationUntil(date: Date): string {
  return date.toLocaleString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}
