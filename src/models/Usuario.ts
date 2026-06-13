export type RolUsuario = 'ayudador' | 'necesita_apoyo'

export const USERS_COLLECTION = 'users'

export interface Usuario {
  id: string
  email: string
  alias: string
  foto_url: string
  rol_enum: RolUsuario
  idioma: string
  pais: string
  creado_en: Date
}

/** Datos mínimos al registrarse (solo email por ahora) */
export type UsuarioRegistro = Pick<Usuario, 'email'>

export type UsuarioInput = Omit<Usuario, 'id' | 'creado_en'>

export type UsuarioUpdate = Partial<Omit<Usuario, 'id' | 'creado_en'>>
