import { useEffect, useRef } from 'react'
import './ChatOptionsMenu.css'

type ChatOptionsMenuProps = {
  open: boolean
  onClose: () => void
  onBlock: () => void
  onUnblock: () => void
  onReport: () => void
  onDeleteChat: () => void
  blockedByMe?: boolean
  reportDisabled?: boolean
}

function ChatOptionsMenu({
  open,
  onClose,
  onBlock,
  onUnblock,
  onReport,
  onDeleteChat,
  blockedByMe = false,
  reportDisabled = false,
}: ChatOptionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="chat-options-menu" ref={menuRef}>
      {blockedByMe ? (
        <button type="button" className="chat-options-menu__item" onClick={onUnblock}>
          <span aria-hidden="true">🔓</span>
          Desbloquear
        </button>
      ) : (
        <button type="button" className="chat-options-menu__item" onClick={onBlock}>
          <span aria-hidden="true">🚫</span>
          Bloquear
        </button>
      )}
      <button
        type="button"
        className={`chat-options-menu__item${
          reportDisabled ? ' chat-options-menu__item--disabled' : ''
        }`}
        disabled={reportDisabled}
        onClick={onReport}
      >
        <span aria-hidden="true">⚠️</span>
        {reportDisabled ? 'Ya denunciado' : 'Denunciar'}
      </button>
      <button
        type="button"
        className="chat-options-menu__item chat-options-menu__item--danger"
        onClick={onDeleteChat}
      >
        <span aria-hidden="true">🗑️</span>
        Eliminar chat
      </button>
    </div>
  )
}

export default ChatOptionsMenu
