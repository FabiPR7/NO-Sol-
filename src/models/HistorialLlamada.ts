export interface HistorialLlamada {
  id: number
  buscador_id: string
  anfitrion_id: string
  duracion_segundos: number
  fecha: Date
}

export type HistorialLlamadaInput = Omit<HistorialLlamada, 'id' | 'fecha'>
