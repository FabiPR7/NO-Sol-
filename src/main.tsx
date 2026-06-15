import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import logoUrl from './assets/logo.png'
import './index.css'
import App from './App.tsx'

const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']")
if (favicon) {
  favicon.type = 'image/png'
  favicon.href = logoUrl
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
