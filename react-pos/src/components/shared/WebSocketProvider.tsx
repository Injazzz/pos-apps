import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { reinitEcho, disconnectEcho } from '@/lib/echo'
import { useWebSocket } from '@/hooks/useWebSocket'

interface Props {
  children: ReactNode
}

// Inner component yang handle listeners
function WebSocketListeners() {
  useWebSocket() // attach semua listeners
  return null
}

export default function WebSocketProvider({ children }: Props) {
  const { isAuthenticated, token } = useAuthStore()

  // Re-init Echo saat token berubah (login/logout)
  useEffect(() => {
    if (isAuthenticated && token) {
      reinitEcho()
    } else {
      disconnectEcho()
    }

    return () => {
      // Jangan disconnect saat re-render, hanya saat actual logout
    }
  }, [isAuthenticated, token])

  return (
    <>
      {isAuthenticated && <WebSocketListeners />}
      {children}
    </>
  )
}