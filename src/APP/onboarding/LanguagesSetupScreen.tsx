import { useEffect, useState, type FormEvent } from 'react'
import AppLogo from '../../components/AppLogo'
import type { Language } from '../../models'
import { listLanguages } from '../services/language'
import './LanguagesSetupScreen.css'

type LanguagesSetupScreenProps = {
  onSubmit: (languageIds: string[]) => Promise<void>
}

function LanguagesSetupScreen({ onSubmit }: LanguagesSetupScreenProps) {
  const [languages, setLanguages] = useState<Language[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingSave, setLoadingSave] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listLanguages()
      .then(setLanguages)
      .catch(() => setError('No se pudieron cargar los idiomas.'))
      .finally(() => setLoadingList(false))
  }, [])

  const toggleLanguage = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (selected.length === 0) {
      setError('Elige al menos un idioma para continuar.')
      return
    }

    setLoadingSave(true)

    try {
      await onSubmit(selected)
    } catch {
      setError('No se pudieron guardar tus idiomas. Inténtalo de nuevo.')
    } finally {
      setLoadingSave(false)
    }
  }

  return (
    <div className="languages-setup">
      <header className="languages-setup__header">
        <AppLogo size="lg" className="languages-setup__logo" />
        <p>Paso 3 de 3 🗣️</p>
      </header>

      <main className="languages-setup__main">
        <h1>¿Qué idiomas hablas?</h1>
        <p className="languages-setup__lead">
          Puedes elegir varios. Así te emparejamos con alguien con quien puedas
          conversar cómodamente.
        </p>

        {loadingList ? (
          <p className="languages-setup__status">Cargando idiomas...</p>
        ) : (
          <form className="languages-setup__form" onSubmit={handleSubmit}>
            <div className="languages-setup__bubbles">
              {languages.map((language) => {
                const isActive = selected.includes(language.id)

                return (
                  <button
                    key={language.id}
                    type="button"
                    className={`languages-setup__bubble${
                      isActive ? ' languages-setup__bubble--active' : ''
                    }`}
                    onClick={() => toggleLanguage(language.id)}
                  >
                    {language.nombre}
                  </button>
                )
              })}
            </div>

            {languages.length === 0 && !error && (
              <p className="languages-setup__status">
                No hay idiomas en Firestore todavía. Añade documentos en la
                colección <strong>language</strong>.
              </p>
            )}

            <p className="languages-setup__count">
              {selected.length} seleccionado{selected.length === 1 ? '' : 's'}
            </p>

            {error && <p className="languages-setup__error">{error}</p>}

            <button
              type="submit"
              className="languages-setup__submit"
              disabled={loadingSave || languages.length === 0}
            >
              {loadingSave ? 'Guardando...' : 'Guardar y continuar →'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}

export default LanguagesSetupScreen
