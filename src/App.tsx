import { useState } from 'react'
import Web from './WEB/Web'
import AppZone from './APP/App'
import type { AuthMode } from './APP/types/user'

type Zone = 'web' | 'app'

function App() {
  const [zone, setZone] = useState<Zone>('web')
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  const enterApp = (mode: AuthMode) => {
    setAuthMode(mode)
    setZone('app')
  }

  const backToWeb = () => {
    setZone('web')
  }

  if (zone === 'app') {
    return <AppZone authMode={authMode} onBack={backToWeb} onSwitchMode={setAuthMode} />
  }

  return <Web onEnterApp={enterApp} />
}

export default App
