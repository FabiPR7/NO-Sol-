import AuthLayout from './AuthLayout'
import type { AuthMode } from '../types/user'

type RegisterScreenProps = {
  onBack: () => void
  onGoLogin: () => void
  onGoogleSignIn: (mode: AuthMode) => Promise<void>
  authError?: string | null
}

function RegisterScreen({ onBack, onGoLogin, onGoogleSignIn, authError }: RegisterScreenProps) {
  return (
    <AuthLayout
      variant="register"
      badge="Empieza hoy 🌱"
      title="Tu espacio empieza aquí"
      text="Regístrate con Google y conecta con alguien que te entienda o a quien puedas ayudar."
      image="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80"
      perks={['🌧️ Necesito apoyo', '🌤️ Quiero ayudar', '🤝 Match por gustos e idioma']}
      switchLabel="¿Ya tienes cuenta?"
      switchAction="Iniciar sesión"
      onBack={onBack}
      onSwitch={onGoLogin}
      onGoogleSignIn={onGoogleSignIn}
      authError={authError}
    />
  )
}

export default RegisterScreen
