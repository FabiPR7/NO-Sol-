const DAILY_PROXY_BASE = '/api/daily'

type DailyRoomResponse = {
  url: string
  name: string
}

export function toDailyRoomName(sessionId: string): string {
  const sanitized = sessionId.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()

  return `nosolo-${sanitized.slice(0, 48)}`
}

async function fetchDailyRoom(roomName: string): Promise<DailyRoomResponse | null> {
  const response = await fetch(`${DAILY_PROXY_BASE}/rooms/${roomName}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('No se pudo consultar la sala de Daily.co')
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
        enable_chat: false,
        enable_screenshare: false,
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

  throw new Error('No se pudo crear la sala de videollamada')
}

export async function getOrCreateDailyRoomUrl(sessionId: string): Promise<string> {
  const roomName = toDailyRoomName(sessionId)
  const existingRoom = await fetchDailyRoom(roomName)

  if (existingRoom) {
    return existingRoom.url
  }

  const createdRoom = await createDailyRoom(roomName)
  return createdRoom.url
}
