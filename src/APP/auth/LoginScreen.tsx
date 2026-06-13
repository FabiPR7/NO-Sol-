import AuthLayout from './AuthLayout'
import type { AuthMode } from '../types/user'

type LoginScreenProps = {
  onBack: () => void
  onGoRegister: () => void
  onGoogleSignIn: (mode: AuthMode) => Promise<void>
}

function LoginScreen({ onBack, onGoRegister, onGoogleSignIn }: LoginScreenProps) {
  return (
    <AuthLayout
      variant="login"
      badge="Ya formas parte 💛"
      title="Qué bueno verte otra vez"
      text="Entra con Google y retoma tus conversaciones cuando quieras."
      image="https://images.unsplash.com/photo-1511632765484-d9892dfe333b?auto=format&fit=crop&w=1200&q=80"
      perks={['🫂 Tus matches te esperan', '💬 Chat o videollamada', '🔒 Siempre privado']}
      switchLabel="¿Aún no tienes cuenta?"
      switchAction="Crear cuenta gratis"
      onBack={onBack}
      onSwitch={onGoRegister}
      onGoogleSignIn={onGoogleSignIn}
    />
  )
}

export default LoginScreen
