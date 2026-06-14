export const LANGUAGE_COLLECTION = 'language'

export interface Language {
  id: string
  nombre: string
}

export type LanguageData = Pick<Language, 'nombre'>
