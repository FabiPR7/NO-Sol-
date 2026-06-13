export interface Interes {
  id: number
  nombre: string
}

export type InteresInput = Omit<Interes, 'id'>
