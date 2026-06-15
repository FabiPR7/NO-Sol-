export type RolUsuario = 'ayudador' | 'necesita_apoyo'
export type SexoUsuario = 'chico' | 'chica' | 'no_responder'
export type FiltroCualquiera = 'cualquiera'
export type FiltroSexo = SexoUsuario | FiltroCualquiera

export const USERS_COLLECTION = 'users'

export interface Usuario {
  id: string
  email: string
  alias: string
  foto_url: string
  rol_enum: RolUsuario
  idioma: string
  pais: string
  edad: number
  sexo: SexoUsuario
  filtro_sexo: FiltroSexo
  filtro_pais: string | FiltroCualquiera
  filtro_language_id: string | FiltroCualquiera
  creado_en: Date
}

/** Datos mínimos al registrarse (solo email por ahora) */
export type UsuarioRegistro = Pick<Usuario, 'email'>

/** Datos que completa el usuario tras registrarse */
export type UsuarioPerfilInput = Pick<
  Usuario,
  'alias' | 'pais' | 'rol_enum' | 'foto_url' | 'edad' | 'sexo'
>

export type UsuarioFiltrosInput = Pick<
  Usuario,
  'filtro_sexo' | 'filtro_pais' | 'filtro_language_id'
>

export type UsuarioInput = Omit<Usuario, 'id' | 'creado_en'>

export type UsuarioUpdate = Partial<Omit<Usuario, 'id' | 'creado_en'>>
