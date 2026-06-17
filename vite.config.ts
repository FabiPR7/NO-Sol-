import {
  defineConfig,
  loadEnv,
  type Connect,
  type Plugin,
  type PreviewServer,
  type ViteDevServer,
} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DAILY_API_BASE = 'https://api.daily.co/v1'

function readRequestBody(
  req: Connect.IncomingMessage,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''

    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function attachDailyProxy(
  middlewares: Connect.Server,
  apiKey: string | undefined,
) {
  middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith('/api/daily/rooms')) {
      next()
      return
    }

    if (!apiKey) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Missing DAILY_API_KEY' }))
      return
    }

    const roomMatch = req.url.match(/^\/api\/daily\/rooms(?:\/([^/?]+))?/)

    try {
      if (req.method === 'GET' && roomMatch?.[1]) {
        const response = await fetch(`${DAILY_API_BASE}/rooms/${roomMatch[1]}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        })

        res.statusCode = response.status
        res.setHeader('Content-Type', 'application/json')
        res.end(await response.text())
        return
      }

      if (req.method === 'POST') {
        const body = await readRequestBody(req)
        const response = await fetch(`${DAILY_API_BASE}/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body,
        })

        res.statusCode = response.status
        res.setHeader('Content-Type', 'application/json')
        res.end(await response.text())
        return
      }

      res.statusCode = 405
      res.end()
    } catch {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Daily proxy error' }))
    }
  })
}

function dailyApiProxy(): Plugin {
  return {
    name: 'daily-api-proxy',
    configureServer(server: ViteDevServer) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      const apiKey = env.DAILY_API_KEY || env.VITE_DAILY_API_KEY
      attachDailyProxy(server.middlewares, apiKey)
    },
    configurePreviewServer(server: PreviewServer) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      const apiKey = env.DAILY_API_KEY || env.VITE_DAILY_API_KEY
      attachDailyProxy(server.middlewares, apiKey)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), dailyApiProxy()],
  server: {
    host: true,
  },
})
