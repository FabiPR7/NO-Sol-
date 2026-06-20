function readErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return ''
  }

  return String((error as { code: string }).code)
}

export function formatAuthError(error: unknown): string {
  const code = readErrorCode(error)

  if (code === 'auth/unauthorized-domain') {
    return (
      'Este dominio no está autorizado para iniciar sesión. En Google Cloud Console, ' +
      'abre el cliente OAuth de Firebase (Web client) y añade ' +
      'https://nomassolo.web.app y https://nomassolo.firebaseapp.com en orígenes JavaScript.'
    )
  }

  if (code === 'auth/popup-blocked') {
    return 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes o prueba en otro navegador.'
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Se cerró la ventana de Google antes de terminar. Inténtalo otra vez.'
  }

  if (code === 'auth/cancelled-popup-request') {
    return 'Ya hay un inicio de sesión en curso. Espera un momento e inténtalo de nuevo.'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'El inicio de sesión con Google no está activado en Firebase Authentication.'
  }

  if (code === 'auth/network-request-failed') {
    return 'Sin conexión. Comprueba tu internet e inténtalo otra vez.'
  }

  if (code === 'permission-denied' || code === 'firestore/permission-denied') {
    return (
      'No tienes permiso para acceder a la base de datos. Revisa las reglas de Firestore ' +
      'del proyecto nomassolo.'
    )
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'No se pudo iniciar sesión con Google.'
}
