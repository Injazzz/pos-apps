import { RouterProvider }    from 'react-router-dom'
import { router }            from './router'
import WebSocketProvider     from '@/components/shared/WebSocketProvider'
import PWAInstallBanner      from '@/components/shared/PWAInstallBanner'
import PWAUpdatePrompt       from '@/components/shared/PWAUpdatePrompt'
import OfflineSyncStatus     from '@/components/shared/OfflineSyncStatus'

export default function App() {
  return (
    <WebSocketProvider>
      <RouterProvider router={router} />

      {/* PWA Components */}
      <PWAInstallBanner />
      <PWAUpdatePrompt />
      <OfflineSyncStatus />
    </WebSocketProvider>
  )
}