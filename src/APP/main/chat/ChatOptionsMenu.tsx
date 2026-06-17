import { useEffect, useRef } from 'react'
import './ChatOptionsMenu.css'

type ChatOptionsMenuProps = {
  open: boolean
  onClose: () => void
  onBlock: () => void
  onReport: () => void
  onDeleteChat: () => void
}

function ChatOptionsMenu({
  open,
  onClose,
  onBlock,
  onReport,
  onDeleteChat,
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
      <button type="button" className="chat-options-menu__item" onClick={onBlock}>
        <span aria-hidden="true">🚫</span>
        Bloquear
      </button>
      <button type="button" className="chat-options-menu__item" onClick={onReport}>
        <span aria-hidden="true">⚠️</span>
        Denunciar
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
