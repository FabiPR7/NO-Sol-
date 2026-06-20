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

export function IconPhone({ className }: IconProps) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      <path d="M14.05 2a9 9 0 0 1 8 7.94" />
      <path d="M14.05 6a5 5 0 0 1 4 4" />
    </svg>
  )
}
