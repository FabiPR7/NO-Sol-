import { useEffect, useState, type FormEvent } from 'react'
import ProfilePhotoPicker from '../../components/ProfilePhotoPicker'
import type { Interes, Language, RolUsuario, SexoUsuario, Usuario } from '../../../models'
import { uploadProfilePhoto } from '../../services/cloudinary'
import {
  getUserInterests,
  listInterests,
  saveUserInterests,
} from '../../services/interes'
import {
  getUserLanguages,
  listLanguages,
  saveUserLanguages,
} from '../../services/language'
import { updateUserProfile } from '../../services/usuario'
import { getProfilePhotoUrl } from '../../utils/profilePhoto'
import type { AppUser } from '../../types/user'
import './ProfileTab.css'

type ProfileTabProps = {
  user: AppUser
  profile: Partial<Usuario> | null
  onProfileUpdated: () => Promise<void>
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

function ProfileTab({ user, profile, onProfileUpdated }: ProfileTabProps) {
  const [alias, setAlias] = useState('')
  const [pais, setPais] = useState('España')
  const [edad, setEdad] = useState('')
  const [sexo, setSexo] = useState<SexoUsuario | null>(null)
  const [rol, setRol] = useState<RolUsuario | null>(null)
  const [allInterests, setAllInterests] = useState<Interes[]>([])
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([])
  const [allLanguages, setAllLanguages] = useState<Language[]>([])
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>([])
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const displayName =
    alias.trim() || profile?.alias || user.name || 'Usuario'
  const email = profile?.email ?? user.email
  const avatarUrl = photoPreview ?? getProfilePhotoUrl(profile, user)
  const rolLabel =
    rol === 'ayudador'
      ? '🌤️ Quiero ayudar'
      : rol === 'necesita_apoyo'
        ? '🌧️ Necesito apoyo'
        : null

  useEffect(() => {
    setAlias(profile?.alias ?? user.name?.split(' ')[0] ?? '')
    setPais(profile?.pais ?? 'España')
    setEdad(profile?.edad ? String(profile.edad) : '')
    setSexo(profile?.sexo ?? null)
    setRol(profile?.rol_enum ?? null)
  }, [profile, user.name])

  useEffect(() => {
    setLoading(true)

    Promise.all([
      listInterests(),
      getUserInterests(user.uid),
      listLanguages(),
      getUserLanguages(user.uid),
    ])
      .then(([interests, userInterests, languages, userLanguages]) => {
        setAllInterests(interests)
        setSelectedInterestIds(userInterests.map((interes) => interes.id))
        setAllLanguages(languages)
        setSelectedLanguageIds(userLanguages.map((language) => language.id))
      })
      .catch(() => setError('No se pudieron cargar tus datos.'))
      .finally(() => setLoading(false))
  }, [user.uid])

  const toggleInterest = (id: string) => {
    setSaved(false)
    setSelectedInterestIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const toggleLanguage = (id: string) => {
    setSaved(false)
    setSelectedLanguageIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const handlePhotoSelect = (file: File, previewUrl: string) => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }

    setPhotoPreview(previewUrl)
    setSelectedPhoto(file)
    setSaved(false)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaved(false)

    if (!alias.trim()) {
      setError('Escribe cómo quieres que te llamemos.')
      return
    }

    if (!rol) {
      setError('Elige si buscas compañía o quieres acompañar a alguien.')
      return
    }

    if (selectedLanguageIds.length === 0) {
      setError('Elige al menos un idioma.')
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

    setSaving(true)

    try {
      let fotoUrl = profile?.foto_url ?? user.picture ?? ''

      if (selectedPhoto) {
        fotoUrl = await uploadProfilePhoto(selectedPhoto, user.uid)
      }

      await updateUserProfile(user.uid, {
        alias: alias.trim(),
        pais,
        edad: edadNumber,
        sexo,
        rol_enum: rol,
        foto_url: fotoUrl,
      })
      await saveUserInterests(user.uid, selectedInterestIds)
      await saveUserLanguages(user.uid, selectedLanguageIds)
      await onProfileUpdated()
      setSelectedPhoto(null)
      setSaved(true)
    } catch {
      setError('No se pudo guardar tu perfil. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="profile-tab">
      <header className="profile-tab__header">
        {avatarUrl ? (
          <img
            className="profile-tab__avatar"
            src={avatarUrl}
            alt={displayName}
          />
        ) : (
          <div className="profile-tab__avatar profile-tab__avatar--fallback">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <h1>{displayName}</h1>
        {rolLabel && <span className="profile-tab__role">{rolLabel}</span>}
      </header>

      <form className="profile-tab__form" onSubmit={handleSubmit}>
        <div className="profile-tab__card">
          <h2>Foto de perfil</h2>
          <ProfilePhotoPicker
            photoUrl={avatarUrl}
            fallbackLabel={displayName}
            onFileSelect={handlePhotoSelect}
            onError={setError}
            disabled={saving || loading}
          />
        </div>

        <div className="profile-tab__card">
          <h2>Tu cuenta</h2>

          <div className="profile-tab__fields">
            <label className="profile-tab__field">
              <span>Nombre</span>
              <input
                type="text"
                value={alias}
                onChange={(e) => {
                  setSaved(false)
                  setAlias(e.target.value)
                }}
                placeholder="Tu nombre o alias"
                maxLength={40}
              />
            </label>

            <div className="profile-tab__field profile-tab__field--readonly">
              <span>Correo</span>
              <p className="profile-tab__readonly">{email}</p>
            </div>

            <label className="profile-tab__field">
              <span>País</span>
              <select
                value={pais}
                onChange={(e) => {
                  setSaved(false)
                  setPais(e.target.value)
                }}
              >
                {paises.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="profile-tab__field">
              <span>Edad</span>
              <input
                type="number"
                inputMode="numeric"
                min={16}
                max={120}
                value={edad}
                onChange={(e) => {
                  setSaved(false)
                  setEdad(e.target.value)
                }}
                placeholder="Tu edad"
              />
            </label>

            <div className="profile-tab__field">
              <span>Sexo</span>
              <div className="profile-tab__sexo-grid">
                <button
                  type="button"
                  className={`profile-tab__sexo${
                    sexo === 'chico' ? ' profile-tab__sexo--active' : ''
                  }`}
                  onClick={() => {
                    setSaved(false)
                    setSexo('chico')
                  }}
                >
                  Chico
                </button>
                <button
                  type="button"
                  className={`profile-tab__sexo${
                    sexo === 'chica' ? ' profile-tab__sexo--active' : ''
                  }`}
                  onClick={() => {
                    setSaved(false)
                    setSexo('chica')
                  }}
                >
                  Chica
                </button>
                <button
                  type="button"
                  className={`profile-tab__sexo${
                    sexo === 'no_responder' ? ' profile-tab__sexo--active' : ''
                  }`}
                  onClick={() => {
                    setSaved(false)
                    setSexo('no_responder')
                  }}
                >
                  Prefiero no responder
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-tab__card">
          <h2>Tus idiomas</h2>
          <p className="profile-tab__lead">
            Puedes elegir varios. Así te emparejamos con alguien con quien puedas
            conversar cómodamente.
          </p>

          {loading ? (
            <p className="profile-tab__status">Cargando idiomas...</p>
          ) : allLanguages.length > 0 ? (
            <>
              <div className="profile-tab__bubbles">
                {allLanguages.map((language) => {
                  const isActive = selectedLanguageIds.includes(language.id)

                  return (
                    <button
                      key={language.id}
                      type="button"
                      className={`profile-tab__bubble profile-tab__bubble--language${
                        isActive ? ' profile-tab__bubble--language-active' : ''
                      }`}
                      onClick={() => toggleLanguage(language.id)}
                    >
                      {language.nombre}
                    </button>
                  )
                })}
              </div>
              <p className="profile-tab__count">
                {selectedLanguageIds.length} seleccionado
                {selectedLanguageIds.length === 1 ? '' : 's'}
              </p>
            </>
          ) : (
            <p className="profile-tab__status">Aún no hay idiomas disponibles.</p>
          )}
        </div>

        <div className="profile-tab__card">
          <h2>¿Qué buscas en No+Sol@?</h2>
          <p className="profile-tab__lead">Elige tu camino.</p>

          <div className="profile-tab__roles-grid">
            <button
              type="button"
              className={`profile-tab__role profile-tab__role--support${
                rol === 'necesita_apoyo' ? ' profile-tab__role--active' : ''
              }`}
              onClick={() => {
                setSaved(false)
                setRol('necesita_apoyo')
              }}
            >
              <span className="profile-tab__role-emoji">🌧️</span>
              <strong>Busco compañía</strong>
              <span>Necesito apoyo y alguien que me escuche.</span>
            </button>

            <button
              type="button"
              className={`profile-tab__role profile-tab__role--helper${
                rol === 'ayudador' ? ' profile-tab__role--active' : ''
              }`}
              onClick={() => {
                setSaved(false)
                setRol('ayudador')
              }}
            >
              <span className="profile-tab__role-emoji">🌤️</span>
              <strong>Quiero ser compañía</strong>
              <span>Tengo ganas de acompañar y escuchar a alguien.</span>
            </button>
          </div>
        </div>

        <div className="profile-tab__card">
          <h2>Tus gustos</h2>
          <p className="profile-tab__lead">
            Elige todo lo que quieras. Así te conectamos con alguien que tenga
            cosas en común contigo.
          </p>

          {loading ? (
            <p className="profile-tab__status">Cargando gustos...</p>
          ) : allInterests.length > 0 ? (
            <>
              <div className="profile-tab__bubbles">
                {allInterests.map((interes) => {
                  const isActive = selectedInterestIds.includes(interes.id)

                  return (
                    <button
                      key={interes.id}
                      type="button"
                      className={`profile-tab__bubble${
                        isActive ? ' profile-tab__bubble--active' : ''
                      }`}
                      onClick={() => toggleInterest(interes.id)}
                    >
                      {interes.nombre}
                    </button>
                  )
                })}
              </div>
              <p className="profile-tab__count">
                {selectedInterestIds.length} seleccionado
                {selectedInterestIds.length === 1 ? '' : 's'}
              </p>
            </>
          ) : (
            <p className="profile-tab__status">Aún no hay gustos disponibles.</p>
          )}
        </div>

        {error && <p className="profile-tab__error">{error}</p>}
        {saved && <p className="profile-tab__success">Perfil guardado correctamente.</p>}

        <button
          type="submit"
          className="profile-tab__submit"
          disabled={saving || loading}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  )
}

export default ProfileTab
