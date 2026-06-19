import { useEffect, useState, type FormEvent } from 'react'
import type {
  FiltroCualquiera,
  FiltroSexo,
  Language,
  Usuario,
} from '../../../models'
import { listLanguages } from '../../services/language'
import { updateUserFilters } from '../../services/usuario'
import TabHero from '../../components/TabHero'
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
  { value: CUALQUIERA, label: 'Cualquiera' },
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
      <TabHero
        eyebrow="⚙️ Personaliza"
        variant="neutral"
        title={
          <>
            ¿Con quién te gustaría{' '}
            <span className="tab-hero__accent">conectar</span>?
          </>
        }
        lead='Ajusta los filtros o déjalos en "Cualquiera" para abrirte a conocer gente nueva.'
      />

      <form className="settings-tab__form" onSubmit={handleSubmit}>
        <div className="settings-tab__card">
          <h2>Sexo</h2>
          <p className="settings-tab__lead">
            Elige un filtro o déjalo en Cualquiera para no limitar.
          </p>

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
          <p className="settings-tab__lead">
            Conecta con alguien de un país concreto o de cualquier lugar.
          </p>

          <label className="settings-tab__field">
            <span>País preferido</span>
            <select
              value={filtroPais}
              onChange={(e) => {
                setSaved(false)
                setFiltroPais(e.target.value)
              }}
            >
              <option value={CUALQUIERA}>Cualquiera</option>
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
            Habla en el idioma que te resulte más cómodo o elige Cualquiera.
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
                <option value={CUALQUIERA}>Cualquiera</option>
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
