import logoSrc from '../assets/logo.png'
import './AppLogo.css'

type AppLogoProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'auth' | 'hero'
  alt?: string
}

function AppLogo({ className = '', size = 'md', alt = 'No+Sol@' }: AppLogoProps) {
  return (
    <img
      src={logoSrc}
      alt={alt}
      className={`app-logo app-logo--${size}${className ? ` ${className}` : ''}`}
    />
  )
}

export default AppLogo
