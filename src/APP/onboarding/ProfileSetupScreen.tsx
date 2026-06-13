import { useState, type FormEvent } from 'react'
import type { RolUsuario } from '../../models'
import type { AppUser } from '../types/user'
import './ProfileSetupScreen.css'

type ProfileSetupScreenProps = {
  user: AppUser
  onSubmit: (data: {
    alias: string
    pais: string
    idioma: string
    rol_enum: RolUsuario
  }) => Promise<void>
}

const paises = [
  'España',
  'México',
  'Argentina',
  'Colombia',
  'Chile',
  'Perú',
  'Estados Unidos',
  'Otro',
]

const idiomas = ['Español', 'English', 'Português', 'Français', 'Otro']

function ProfileSetupScreen({ user, onSubmit }: ProfileSetupScreenProps) {
  const [alias, setAlias] = useState(user.name?.split(' ')[0] ?? '')
  const [pais, setPais] = useState('España')
  const [idioma, setIdioma] = useState('Español')
  const [rol, setRol] = useState<RolUsuario | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!alias.trim()) {
      setError('Escribe cómo quieres que te llamemos.')
      return
    }

    if (!rol) {
      setError('Elige si buscas compañía o quieres acompañar a alguien.')
      return
    }

    setLoading(true)

    try {
      await onSubmit({
        alias: alias.trim(),
        pais,
        idioma,
        rol_enum: rol,
      })
    } catch {
      setError('No se pudo guardar tu perfil. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-setup">
      <header className="profile-setup__header">
        <span className="profile-setup__logo">No+Sol@</span>
        <p>Casi listo 🌱</p>
      </header>

      <main className="profile-setup__main">
        <h1>Cuéntanos un poco sobre ti</h1>
        <p className="profile-setup__lead">
          Es tu primera vez aquí. Completa tu perfil para que podamos conectarte
          con la persona adecuada.
        </p>
        <p className="profile-setup__email">
          Cuenta registrada: <strong>{user.email}</strong>
        </p>

        <form className="profile-setup__form" onSubmit={handleSubmit}>
          <section className="profile-setup__roles">
            <h2>¿Qué buscas en No+Sol@?</h2>
            <p>Lo más importante: elige tu camino.</p>

            <div className="profile-setup__roles-grid">
              <button
                type="button"
                className={`profile-setup__role profile-setup__role--support${
                  rol === 'necesita_apoyo' ? ' profile-setup__role--active' : ''
                }`}
                onClick={() => setRol('necesita_apoyo')}
              >
                <span className="profile-setup__role-emoji">🌧️</span>
                <strong>Busco compañía</strong>
                <span>Necesito apoyo y alguien que me escuche.</span>
              </button>

              <button
                type="button"
                className={`profile-setup__role profile-setup__role--helper${
                  rol === 'ayudador' ? ' profile-setup__role--active' : ''
                }`}
                onClick={() => setRol('ayudador')}
              >
                <span className="profile-setup__role-emoji">🌤️</span>
                <strong>Quiero ser compañía</strong>
                <span>Tengo ganas de acompañar y escuchar a alguien.</span>
              </button>
            </div>
          </section>

          <section className="profile-setup__fields">
            <label className="profile-setup__field">
              <span>¿Cómo te llamamos?</span>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Tu nombre o alias"
                maxLength={40}
              />
            </label>

            <label className="profile-setup__field">
              <span>País</span>
              <select value={pais} onChange={(e) => setPais(e.target.value)}>
                {paises.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="profile-setup__field">
              <span>Idioma</span>
              <select value={idioma} onChange={(e) => setIdioma(e.target.value)}>
                {idiomas.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {error && <p className="profile-setup__error">{error}</p>}

          <button type="submit" className="profile-setup__submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Entrar a No+Sol@ →'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default ProfileSetupScreen
