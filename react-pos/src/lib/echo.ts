import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { useAuthStore } from '@/stores/authStore'

declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo
  }
}

window.Pusher = Pusher

let echoInstance: Echo | null = null

export function getEcho(): Echo {
  if (echoInstance) return echoInstance

  const token = useAuthStore.getState().token

  echoInstance = new Echo({
    broadcaster       : 'reverb',
    key               : import.meta.env.VITE_REVERB_APP_KEY,
    wsHost            : import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    wsPort            : Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort           : Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS          : (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports : ['ws', 'wss'],
    disableStats      : true,
    authEndpoint      : `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization : `Bearer ${token}`,
        Accept        : 'application/json',
      },
    },
  })

  window.Echo = echoInstance
  return echoInstance
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}

// Re-init echo dengan token terbaru (dipanggil setelah login)
export function reinitEcho(): Echo {
  disconnectEcho()
  return getEcho()
}