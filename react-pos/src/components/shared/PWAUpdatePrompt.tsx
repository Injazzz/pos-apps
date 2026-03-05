import { RefreshCw }           from 'lucide-react'
import { Button }              from '@/components/ui/button'
import { useRegisterSW }       from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      setNeedRefresh(true)
    },
    onOfflineReady() {
      console.log('[PWA] App is ready to work offline')
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-80">
      <div className="bg-primary text-primary-foreground rounded-xl shadow-lg p-4 flex items-center gap-3">
        <RefreshCw className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Update Tersedia</p>
          <p className="text-xs opacity-80">
            Versi baru aplikasi siap digunakan
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0 h-7 text-xs"
          onClick={() => updateServiceWorker(true)}
        >
          Update
        </Button>
      </div>
    </div>
  )
}