export const INTERESTS_COLLECTION = 'interests'

export interface Interes {
  id: string
  nombre: string
}

export type InteresData = Pick<Interes, 'nombre'>
