export interface ReporteBloqueo {
  id: number
  denunciante_id: string
  denunciado_id: string
  motivo: string
  creado_en: Date
}

export type ReporteBloqueoInput = Omit<ReporteBloqueo, 'id' | 'creado_en'>
