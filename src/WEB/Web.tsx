import './Web.css'
import type { AuthMode } from '../APP/types/user'

type WebProps = {
  onEnterApp: (mode: AuthMode) => void
}

const photos = {
  heroBg:
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1920&q=85',
  heroHug:
    'https://images.unsplash.com/photo-1511632765484-d9892dfe333b?auto=format&fit=crop&w=800&q=80',
  videoCall:
    'https://thumbs.dreamstime.com/z/grupo-de-personas-en-una-videollamada-desde-casa-diversas-sus-hogares-nuevo-concepto-estilo-vida-normal-227284160.jpg',
  laughing:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
  needSupport:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  wantHelp:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  ctaBg:
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80',
  friends:
  'https://img.freepik.com/foto-gratis/amigos-felices-pareja-enamorados-chateando-hablando-video-llamada-usando-camara-web-computadora-portatil-concepto-amor-virtual-trabajo-linea-leccion-estudio-educacion-citas-chica-haciendo-videollamada-chico-sonriendo_157823-514.jpg?size=626&ext=jpg'
  
}

const strip = [
  { emoji: '🔒', title: 'Privado', text: 'Tu historia, tu ritmo' },
  { emoji: '🫂', title: 'Sin juicios', text: 'Aquí no hay que fingir' },
  { emoji: '💬', title: 'A tu ritmo', text: 'Chat o videollamada' },
  { emoji: '🤝', title: 'Match real', text: 'Gustos, idioma y zona' },
]

function Web({ onEnterApp }: WebProps) {
  return (
    <div className="web">
      <section
        className="web-cover"
        style={{ backgroundImage: `url(${photos.heroBg})` }}
      >
        <div className="web-cover__shade" />

        <header className="web-header">
          <a className="web-logo" href="#">
            No+Sol@
          </a>
          <nav className="web-nav">
            <button type="button" className="web-btn web-btn--glass" onClick={() => onEnterApp('login')}>
              Entrar
            </button>
            <button type="button" className="web-btn web-btn--warm" onClick={() => onEnterApp('register')}>
              Unirme gratis
            </button>
          </nav>
        </header>

        <div className="web-cover__body">
          <div className="web-cover__main">
            <p className="web-cover__eyebrow">
              Para cuando el silencio pesa demasiado 🤍
            </p>
            <h1>
              Gente de verdad.
              <span> Conversaciones de verdad.</span>
            </h1>
            <p className="web-cover__lead">
              No+Sol@ junta a quien necesita compañía con quien quiere escuchar.
              Por tus gustos, tu idioma y tu zona. Sin postureo, sin prisa.
            </p>
            <div className="web-cover__actions">
              <button type="button" className="web-btn web-btn--warm web-btn--xl" onClick={() => onEnterApp('register')}>
                Quiero unirme
              </button>
              <button type="button" className="web-btn web-btn--glass web-btn--xl" onClick={() => onEnterApp('login')}>
                Ya tengo cuenta
              </button>
            </div>
          </div>

          <aside className="web-cover__aside">
            <div className="web-float-card">
              <img src={photos.videoCall} alt="Videollamada entre personas" />
              <div>
                <strong>te escucho 💛</strong>
                <p>Conecta por chat o videollamada cuando te apetezca.</p>
              </div>
            </div>
            <div className="web-float-card web-float-card--mini">
              <span>hola 👋</span>
              <span>🫂</span>
              <span>✨</span>
            </div>
            <p className="web-cover__caption">
              Así se siente encontrar a alguien que te entiende
            </p>
          </aside>
        </div>
      </section>

      <section className="web-strip">
        {strip.map((item) => (
          <article key={item.title} className="web-strip__item">
            <span className="web-strip__emoji">{item.emoji}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="web-block">
        <div className="web-block__media">
          <img src={photos.laughing} alt="Amigos riendo juntos" />
          <img src={photos.friends} alt="Amigos riendo juntos" />
        </div>
        <div className="web-block__text">
          <h2>No es otra red social vacía</h2>
          <p>
            Sabemos lo que es sentirse fuera de sitio, agotado de fingir o simplemente
            necesitar hablar con alguien que no te juzgue. Aquí no vienes a impresionar
            a nadie — vienes a conectar.
          </p>
          <p>
            Personas con depresión, ansiedad o dificultad para socializar encuentran
            a alguien dispuesto a acompañarlas. Y quien quiere ayudar, encuentra a
            alguien que de verdad lo necesita.
          </p>
          <div className="web-chips">
            <span>😄 Momentos reales</span>
            <span>📱 Videollamada</span>
            <span>☕ Sin prisas</span>
            <span>🌿 Espacio seguro</span>
          </div>
        </div>
      </section>

      <section className="web-paths">
        <header className="web-paths__head">
          <h2>¿Desde dónde llegas hoy?</h2>
          <p>Dos formas de estar. Las dos son válidas.</p>
        </header>

        <div className="web-paths__grid">
          <article className="web-path">
            <img src={photos.needSupport} alt="Persona buscando compañía" />
            <div className="web-path__content">
              <span className="web-path__label web-path__label--a">Necesito apoyo</span>
              <h3>A veces solo quiero que alguien esté ahí</h3>
              <p>
                Para días grises, noches largas o momentos en los que hablar cuesta.
                Te emparejamos con alguien que quiera escucharte de verdad.
              </p>
              <button type="button" className="web-btn web-btn--warm" onClick={() => onEnterApp('register')}>
                Busco apoyo →
              </button>
            </div>
          </article>

          <article className="web-path">
            <img src={photos.wantHelp} alt="Persona en videollamada ayudando" />
            <div className="web-path__content">
              <span className="web-path__label web-path__label--b">Quiero ayudar</span>
              <h3>Tengo ganas de acompañar a alguien</h3>
              <p>
                No hace falta ser experto. Basta con empatía, tiempo y ganas de
                estar presente para alguien que lo necesita.
              </p>
              <button type="button" className="web-btn web-btn--dark" onClick={() => onEnterApp('register')}>
                Quiero ayudar →
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="web-bento" id="como-funciona">
        <div className="web-bento__match">
          <h2>Te presentamos a alguien que encaje contigo</h2>
          <p>
            Miramos lo que os gusta, el idioma que habláis y dónde estáis.
            Así la primera conversación no empieza en frío.
          </p>
          <div className="web-bento__tags">
            <span>🎮 Mismos hobbies</span>
            <span>🗣️ Mismo idioma</span>
            <span>📍 Cerca de ti</span>
            <span>💬 Chat o videollamada</span>
          </div>
        </div>

        <div className="web-bento__steps">
          <h3>Tres pasos y listo</h3>
          <ol>
            <li>
              <strong>1</strong>
              <div>
                <span>Cuéntanos quién eres</span>
                <p>Elige si buscas apoyo o quieres ayudar.</p>
              </div>
            </li>
            <li>
              <strong>2</strong>
              <div>
                <span>Lo tuyo, lo nuestro</span>
                <p>Gustos, idioma y ciudad. Sin formularios eternos.</p>
              </div>
            </li>
            <li>
              <strong>3</strong>
              <div>
                <span>Hablad cuando queráis</span>
                <p>Tu match aparece. Tú marcas el ritmo.</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="web-bento__quote">
          <p>“Nadie debería pasarlo en silencio.”</p>
          <span>💛 No+Sol@</span>
        </div>
      </section>

      <section
        className="web-cta"
        style={{ backgroundImage: `url(${photos.ctaBg})` }}
      >
        <div className="web-cta__shade" />
        <div className="web-cta__inner">
          <p className="web-cta__emoji">✨ 🫂 ✨</p>
          <h2>Alguien te está esperando al otro lado</h2>
          <p>
            Puede que hoy necesites ayuda. O puede que hoy puedas dársela a alguien.
            Empieza cuando quieras.
          </p>
          <div className="web-cta__actions">
            <button type="button" className="web-btn web-btn--warm web-btn--xl" onClick={() => onEnterApp('register')}>
              Crear mi cuenta
            </button>
            <button type="button" className="web-btn web-btn--glass web-btn--xl" onClick={() => onEnterApp('login')}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </section>

      <footer className="web-footer">
        <span className="web-logo">No+Sol@</span>
        <p>Conectando personas. Una conversación a la vez. 💛</p>
      </footer>
    </div>
  )
}

export default Web
