import { useEffect, useState, type FormEvent } from 'react'
import type {
  FiltroCualquiera,
  FiltroSexo,
  Language,
  Usuario,
} from '../../../models'
import { listLanguages } from '../../services/language'
import { updateUserFilters } from '../../services/usuario'
import type { AppUser } from '../../types/user'
import './SettingsTab.css'

type SettingsTabProps = {
  user: AppUser
  profile: Partial<Usuario> | null
  onFiltersUpdated: () => Promise<void>
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

const CUALQUIERA: FiltroCualquiera = 'cualquiera'

const sexoFilterOptions: { value: FiltroSexo; label: string }[] = [
  { value: CUALQUIERA, label: 'Lo que sea' },
  { value: 'chico', label: 'Solo chicos' },
  { value: 'chica', label: 'Solo chicas' },
  { value: 'no_responder', label: 'Prefiero no responder' },
]

function SettingsTab({ user, profile, onFiltersUpdated }: SettingsTabProps) {
  const [filtroSexo, setFiltroSexo] = useState<FiltroSexo>(CUALQUIERA)
  const [filtroPais, setFiltroPais] = useState<string | FiltroCualquiera>(CUALQUIERA)
  const [filtroLanguageId, setFiltroLanguageId] = useState<string | FiltroCualquiera>(
    CUALQUIERA,
  )
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setFiltroSexo(profile?.filtro_sexo ?? CUALQUIERA)
    setFiltroPais(profile?.filtro_pais ?? CUALQUIERA)
    setFiltroLanguageId(profile?.filtro_language_id ?? CUALQUIERA)
  }, [profile])

  useEffect(() => {
    listLanguages()
      .then(setLanguages)
      .catch(() => setError('No se pudieron cargar los idiomas.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)

    try {
      await updateUserFilters(user.uid, {
        filtro_sexo: filtroSexo,
        filtro_pais: filtroPais,
        filtro_language_id: filtroLanguageId,
      })
      await onFiltersUpdated()
      setSaved(true)
    } catch {
      setError('No se pudieron guardar los ajustes. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="settings-tab">
      <header className="settings-tab__header">
        <h1>Ajustes de búsqueda</h1>
        <p>
          Elige con quién te gustaría conectar. Puedes dejar todo en &quot;Lo que
          sea&quot; para no filtrar.
        </p>
      </header>

      <form className="settings-tab__form" onSubmit={handleSubmit}>
        <div className="settings-tab__card">
          <h2>Sexo</h2>
          <p className="settings-tab__lead">Filtra por sexo o déjalo abierto.</p>

          <div className="settings-tab__options">
            {sexoFilterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`settings-tab__option${
                  filtroSexo === option.value ? ' settings-tab__option--active' : ''
                }`}
                onClick={() => {
                  setSaved(false)
                  setFiltroSexo(option.value)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-tab__card">
          <h2>País</h2>
          <p className="settings-tab__lead">Busca en un país concreto o en cualquiera.</p>

          <label className="settings-tab__field">
            <span>País preferido</span>
            <select
              value={filtroPais}
              onChange={(e) => {
                setSaved(false)
                setFiltroPais(e.target.value)
              }}
            >
              <option value={CUALQUIERA}>Lo que sea</option>
              {paises.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="settings-tab__card">
          <h2>Idioma</h2>
          <p className="settings-tab__lead">
            Filtra por un idioma concreto o acepta cualquiera.
          </p>

          {loading ? (
            <p className="settings-tab__status">Cargando idiomas...</p>
          ) : (
            <label className="settings-tab__field">
              <span>Idioma preferido</span>
              <select
                value={filtroLanguageId}
                onChange={(e) => {
                  setSaved(false)
                  setFiltroLanguageId(e.target.value)
                }}
              >
                <option value={CUALQUIERA}>Lo que sea</option>
                {languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && <p className="settings-tab__error">{error}</p>}
        {saved && (
          <p className="settings-tab__success">Ajustes guardados correctamente.</p>
        )}

        <button
          type="submit"
          className="settings-tab__submit"
          disabled={saving || loading}
        >
          {saving ? 'Guardando...' : 'Guardar ajustes'}
        </button>
      </form>
    </section>
  )
}

export default SettingsTab
