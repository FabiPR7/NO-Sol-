const DAILY_PROXY_BASE = '/api/daily'

type DailyRoomResponse = {
  url: string
  name: string
}

type DailyErrorResponse = {
  error?: string
  info?: string
}

export function toDailyRoomName(sessionId: string): string {
  const sanitized = sessionId.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()

  return `nosolo-${sanitized.slice(0, 48)}`
}

export function formatDailyUserMessage(raw: string): string {
  const message = raw.trim()
  const lower = message.toLowerCase()

  if (
    lower.includes('payment method') ||
    lower.includes('missing payment') ||
    lower.includes('billing')
  ) {
    return (
      'Tu cuenta de Daily.co necesita un método de pago. Entra en ' +
      'https://dashboard.daily.co → Billing, añade una tarjeta y vuelve a probar. ' +
      'Daily suele regalar crédito gratis al registrarla; las videollamadas básicas consumen poco.'
    )
  }

  if (lower.includes('authentication') || lower.includes('401')) {
    return 'La clave de Daily.co no es válida. Revisa DAILY_API_KEY en tu archivo .env.'
  }

  return message
}

async function parseDailyError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as DailyErrorResponse

    if (response.status === 401) {
      return formatDailyUserMessage('authentication-error')
    }

    if (data.info) {
      return formatDailyUserMessage(data.info)
    }

    if (data.error) {
      return formatDailyUserMessage(data.error)
    }
  } catch {
    // ignore JSON parse errors
  }

  return `Daily.co respondió con error ${response.status}.`
}

async function fetchDailyRoom(roomName: string): Promise<DailyRoomResponse | null> {
  const response = await fetch(
    `${DAILY_PROXY_BASE}/rooms/${encodeURIComponent(roomName)}`,
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await parseDailyError(response))
  }

  return (await response.json()) as DailyRoomResponse
}

async function createDailyRoom(roomName: string): Promise<DailyRoomResponse> {
  const expiresAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60

  const response = await fetch(`${DAILY_PROXY_BASE}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: roomName,
      properties: {
        exp: expiresAt,
        max_participants: 2,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  })

  if (response.ok) {
    return (await response.json()) as DailyRoomResponse
  }

  if (response.status === 400) {
    const existingRoom = await fetchDailyRoom(roomName)

    if (existingRoom) {
      return existingRoom
    }
  }

  throw new Error(await parseDailyError(response))
}

export async function getOrCreateDailyRoomUrl(sessionId: string): Promise<string> {
  const roomName = toDailyRoomName(sessionId)
  const existingRoom = await fetchDailyRoom(roomName)

  if (existingRoom?.url) {
    return existingRoom.url
  }

  const createdRoom = await createDailyRoom(roomName)
  return createdRoom.url
}
