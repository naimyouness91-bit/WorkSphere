import type Echo from 'laravel-echo'
import type Pusher from 'pusher-js'

let echoInstance: Echo<'pusher'> | null = null
let pusherModule: typeof Pusher | null = null

const key = import.meta.env.VITE_PUSHER_APP_KEY
const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1'
const wsHost = import.meta.env.VITE_PUSHER_HOST
const wsPort = import.meta.env.VITE_PUSHER_PORT
const scheme = import.meta.env.VITE_PUSHER_SCHEME ?? 'https'
const forceTLS = scheme === 'https'

function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}

async function loadEchoModules(): Promise<{
  Echo: typeof Echo
  Pusher: typeof Pusher
}> {
  const [echoMod, pusherMod] = await Promise.all([
    import('laravel-echo'),
    import('pusher-js'),
  ])
  return { Echo: echoMod.default, Pusher: pusherMod.default }
}

export async function initEcho(token: string): Promise<Echo<'pusher'> | null> {
  if (!key) {
    return null
  }

  disconnectEcho()

  const { Echo, Pusher } = await loadEchoModules()
  pusherModule = Pusher
  window.Pusher = Pusher

  const apiBase = apiBaseUrl()
  const authEndpoint = apiBase ? `${apiBase}/api/broadcasting/auth` : '/api/broadcasting/auth'

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key,
    cluster,
    forceTLS,
    disableStats: true,
    authEndpoint,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
    ...(wsHost
      ? {
          wsHost,
          wsPort: Number(wsPort) || 6001,
          wssPort: Number(wsPort) || 6001,
          enabledTransports: ['ws', 'wss'] as ('ws' | 'wss')[],
        }
      : {}),
  })

  window.Echo = echoInstance

  return echoInstance
}

export function getEcho(): Echo<'pusher'> | null {
  return echoInstance
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
    window.Echo = undefined
  }
  if (pusherModule) {
    window.Pusher = pusherModule
  }
}

declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo?: Echo<'pusher'>
  }
}
