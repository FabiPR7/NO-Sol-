import './ChatsTab.css'

function ChatsTab() {
  return (
    <section className="chats-tab">
      <header className="chats-tab__header">
        <h1>Chats</h1>
        <p>Tus conversaciones activas</p>
      </header>

      <div className="chats-tab__empty">
        <span className="chats-tab__emoji">💬</span>
        <h2>Aún no tienes chats</h2>
        <p>
          Cuando encuentres a alguien en la pestaña Buscar, vuestras
          conversaciones aparecerán aquí.
        </p>
      </div>
    </section>
  )
}

export default ChatsTab
