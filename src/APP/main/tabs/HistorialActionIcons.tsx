type IconProps = {
  className?: string
}

export function IconHistorialChat({ className }: IconProps) {
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
      <path d="M5.5 6.5h13a2.2 2.2 0 0 1 2.2 2.2v6.3a2.2 2.2 0 0 1-2.2 2.2H11l-3.8 2.6a1 1 0 0 1-1.5-.86V17.2" />
      <path d="M8.5 11h7" />
      <path d="M8.5 14h4.5" />
    </svg>
  )
}

export function IconHistorialReport({ className }: IconProps) {
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
      <path d="M5.5 4.5v15" />
      <path d="M5.5 4.5 14 7.5l4.5-1.5v9l-4.5-1.5-8.5 3V4.5z" />
      <path d="M12 9v3.5" />
      <circle cx="12" cy="14.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconHistorialDelete({ className }: IconProps) {
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
      <path d="M9 5.5h6" />
      <path d="M10 5.5V4.8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v.7" />
      <path d="M7.5 5.5h9l-.7 11.2a1.5 1.5 0 0 1-1.5 1.4H9.7a1.5 1.5 0 0 1-1.5-1.4L7.5 5.5z" />
      <path d="M10 9.5v6" />
      <path d="M14 9.5v6" />
    </svg>
  )
}

export function IconHistorialSpinner({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="36 18"
      />
    </svg>
  )
}
