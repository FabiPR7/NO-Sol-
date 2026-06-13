export interface Amigo {
  id: number
  usuario_1_id: string
  usuario_2_id: string
  amigos_desde: Date
}

export type AmigoInput = Omit<Amigo, 'id' | 'amigos_desde'>
