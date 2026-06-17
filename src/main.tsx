import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import logoUrl from './assets/logo.png'
import { bootstrapGoogleAuth } from './APP/services/usuario/authBootstrap'
import './index.css'
import App from './App.tsx'

const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']")
if (favicon) {
  favicon.type = 'image/png'
  favicon.href = logoUrl
}

const root = createRoot(document.getElementById('root')!)

bootstrapGoogleAuth()
  .catch((error) => {
    console.error('Error al procesar el inicio de sesión con Google:', error)
  })
  .finally(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
