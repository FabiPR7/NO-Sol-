type IconProps = {
  className?: string
}

export function IconPhoto({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <circle cx="9" cy="10.5" r="1.75" />
      <path d="M7 16.5l3.2-3.2a1.2 1.2 0 0 1 1.7 0L16.5 16.5" />
      <path d="M14 12.5l2-2a1.2 1.2 0 0 1 1.7 0L20.5 15.5" />
    </svg>
  )
}

export function IconMic({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 10.5a6 6 0 0 0 12 0" />
      <path d="M12 16.5V20" />
      <path d="M9 20h6" />
    </svg>
  )
}

export function IconStop({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </svg>
  )
}

export function IconVideo({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="6.5" width="11.5" height="11" rx="2.2" />
      <path d="M15 10.2l5.2-3.1a1 1 0 0 1 1.5.86v8.08a1 1 0 0 1-1.5.86L15 13.8" />
    </svg>
  )
}
