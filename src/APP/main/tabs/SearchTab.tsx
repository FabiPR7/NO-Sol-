import type { Usuario } from '../../../models'
import './SearchTab.css'

type SearchTabProps = {
  profile: Partial<Usuario> | null
}

function SearchTab({ profile }: SearchTabProps) {
  const isHelper = profile?.rol_enum === 'ayudador'

  return (
    <section className="search-tab">
      <div className="search-tab__hero">
        <span className="search-tab__badge">
          {isHelper ? '🌤️ Modo ayudador' : '🌧️ Modo apoyo'}
        </span>
        <h1>Busca tu amigo/a</h1>
        <p>
          Te conectamos con alguien compatible por tus gustos, idioma y zona.
          Elige cómo quieres hablar hoy.
        </p>
      </div>

      <div className="search-tab__actions">
        <button type="button" className="search-tab__card search-tab__card--video">
          <span className="search-tab__emoji">📹</span>
          <div>
            <strong>Videollamada</strong>
            <p>Cara a cara, en tiempo real.</p>
          </div>
        </button>

        <button type="button" className="search-tab__card search-tab__card--chat">
          <span className="search-tab__emoji">💬</span>
          <div>
            <strong>Chat</strong>
            <p>Escribe a tu ritmo, sin prisa.</p>
          </div>
        </button>
      </div>

      <div className="search-tab__info">
        <p>🫂 Conexión real · Sin juicios · A tu ritmo</p>
      </div>
    </section>
  )
}

export default SearchTab
