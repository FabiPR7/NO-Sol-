import { useEffect, useState, type FormEvent } from 'react'
import type { Interes } from '../../models'
import { listInterests } from '../services/interes'
import './InterestsSetupScreen.css'

type InterestsSetupScreenProps = {
  onSubmit: (interestIds: string[]) => Promise<void>
}

function InterestsSetupScreen({ onSubmit }: InterestsSetupScreenProps) {
  const [interests, setInterests] = useState<Interes[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingSave, setLoadingSave] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listInterests()
      .then(setInterests)
      .catch(() => setError('No se pudieron cargar los intereses.'))
      .finally(() => setLoadingList(false))
  }, [])

  const toggleInterest = (id: string) => {
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
      setError('Elige al menos un interés para continuar.')
      return
    }

    setLoadingSave(true)

    try {
      await onSubmit(selected)
    } catch {
      setError('No se pudieron guardar tus intereses. Inténtalo de nuevo.')
    } finally {
      setLoadingSave(false)
    }
  }

  return (
    <div className="interests-setup">
      <header className="interests-setup__header">
        <span className="interests-setup__logo">No+Sol@</span>
        <p>Paso 2 de 2 ✨</p>
      </header>

      <main className="interests-setup__main">
        <h1>¿Qué te gusta?</h1>
        <p className="interests-setup__lead">
          Elige todo lo que quieras. Así te conectamos con alguien que tenga
          cosas en común contigo.
        </p>

        {loadingList ? (
          <p className="interests-setup__status">Cargando intereses...</p>
        ) : (
          <form className="interests-setup__form" onSubmit={handleSubmit}>
            <div className="interests-setup__bubbles">
              {interests.map((interes) => {
                const isActive = selected.includes(interes.id)

                return (
                  <button
                    key={interes.id}
                    type="button"
                    className={`interests-setup__bubble${
                      isActive ? ' interests-setup__bubble--active' : ''
                    }`}
                    onClick={() => toggleInterest(interes.id)}
                  >
                    {interes.nombre}
                  </button>
                )
              })}
            </div>

            {interests.length === 0 && !error && (
              <p className="interests-setup__status">
                No hay intereses en Firestore todavía. Añade documentos en la
                colección <strong>interests</strong>.
              </p>
            )}

            <p className="interests-setup__count">
              {selected.length} seleccionado{selected.length === 1 ? '' : 's'}
            </p>

            {error && <p className="interests-setup__error">{error}</p>}

            <button
              type="submit"
              className="interests-setup__submit"
              disabled={loadingSave || interests.length === 0}
            >
              {loadingSave ? 'Guardando...' : 'Guardar y continuar →'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}

export default InterestsSetupScreen
