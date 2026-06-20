const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

const DAILY_API_BASE = 'https://api.daily.co/v1'
const dailyApiKey = defineSecret('DAILY_API_KEY')

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''

    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

exports.dailyProxy = onRequest(
  {
    region: 'europe-west1',
    cors: true,
    secrets: [dailyApiKey],
  },
  async (req, res) => {
    const apiKey = dailyApiKey.value()

    if (!apiKey) {
      res.status(500).json({ error: 'Missing DAILY_API_KEY' })
      return
    }

    const path = req.path || req.url?.split('?')[0] || ''
    const roomMatch = path.match(/^\/api\/daily\/rooms(?:\/([^/]+))?$/)

    if (!roomMatch) {
      res.status(404).end()
      return
    }

    try {
      if (req.method === 'GET' && roomMatch[1]) {
        const roomName = decodeURIComponent(roomMatch[1])
        const response = await fetch(
          `${DAILY_API_BASE}/rooms/${encodeURIComponent(roomName)}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        )

        res.status(response.status)
        res.set('Content-Type', 'application/json')
        res.send(await response.text())
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

        res.status(response.status)
        res.set('Content-Type', 'application/json')
        res.send(await response.text())
        return
      }

      res.status(405).end()
    } catch {
      res.status(502).json({ error: 'Daily proxy error' })
    }
  },
)
