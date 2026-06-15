import { useState, type FormEvent } from 'react'
import AppLogo from '../../components/AppLogo'
import ProfilePhotoPicker from '../components/ProfilePhotoPicker'
import { uploadProfilePhoto } from '../services/cloudinary'
import type { RolUsuario, SexoUsuario } from '../../models'
import { getProfilePhotoUrl } from '../utils/profilePhoto'
import type { AppUser } from '../types/user'
import './ProfileSetupScreen.css'

type ProfileSetupScreenProps = {
  user: AppUser
  onSubmit: (data: {
    alias: string
    pais: string
    rol_enum: RolUsuario
    foto_url: string
    edad: number
    sexo: SexoUsuario
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

function ProfileSetupScreen({ user, onSubmit }: ProfileSetupScreenProps) {
  const [alias, setAlias] = useState(user.name?.split(' ')[0] ?? '')
  const [pais, setPais] = useState('España')
  const [edad, setEdad] = useState('')
  const [sexo, setSexo] = useState<SexoUsuario | null>(null)
  const [rol, setRol] = useState<RolUsuario | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentPhotoUrl = photoPreview ?? getProfilePhotoUrl(null, user)

  const handlePhotoSelect = (file: File, previewUrl: string) => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }

    setPhotoPreview(previewUrl)
    setSelectedPhoto(file)
    setError(null)
  }

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

    if (!sexo) {
      setError('Indica tu sexo o elige prefiero no responder.')
      return
    }

    const edadNumber = Number(edad)
    if (!edad.trim() || Number.isNaN(edadNumber) || edadNumber < 16 || edadNumber > 120) {
      setError('Indica una edad válida (entre 16 y 120 años).')
      return
    }

    setLoading(true)

    try {
      let fotoUrl = user.picture ?? ''

      if (selectedPhoto) {
        fotoUrl = await uploadProfilePhoto(selectedPhoto, user.uid)
      }

      await onSubmit({
        alias: alias.trim(),
        pais,
        rol_enum: rol,
        foto_url: fotoUrl,
        edad: edadNumber,
        sexo,
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
        <AppLogo size="lg" className="profile-setup__logo" />
        <p>Paso 1 de 3 🌱</p>
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
          <section className="profile-setup__photo">
            <h2>Tu foto de perfil</h2>
            <p>Sube una foto tuya o elige una desde tus archivos.</p>
            <ProfilePhotoPicker
              photoUrl={currentPhotoUrl}
              fallbackLabel={alias || user.name || 'Usuario'}
              onFileSelect={handlePhotoSelect}
              onError={setError}
              disabled={loading}
            />
          </section>

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
              <span>Edad</span>
              <input
                type="number"
                inputMode="numeric"
                min={16}
                max={120}
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                placeholder="Tu edad"
              />
            </label>

            <div className="profile-setup__field">
              <span>Sexo</span>
              <div className="profile-setup__sexo-grid">
                <button
                  type="button"
                  className={`profile-setup__sexo${
                    sexo === 'chico' ? ' profile-setup__sexo--active' : ''
                  }`}
                  onClick={() => setSexo('chico')}
                >
                  Chico
                </button>
                <button
                  type="button"
                  className={`profile-setup__sexo${
                    sexo === 'chica' ? ' profile-setup__sexo--active' : ''
                  }`}
                  onClick={() => setSexo('chica')}
                >
                  Chica
                </button>
                <button
                  type="button"
                  className={`profile-setup__sexo${
                    sexo === 'no_responder' ? ' profile-setup__sexo--active' : ''
                  }`}
                  onClick={() => setSexo('no_responder')}
                >
                  Prefiero no responder
                </button>
              </div>
            </div>
          </section>

          {error && <p className="profile-setup__error">{error}</p>}

          <button type="submit" className="profile-setup__submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Continuar →'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default ProfileSetupScreen
