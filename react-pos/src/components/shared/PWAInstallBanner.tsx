import { useState }          from 'react'
import { Download, X }       from 'lucide-react'
import { Button }            from '@/components/ui/button'
import { usePWAInstall }     from '@/hooks/usePWAInstall'

export default function PWAInstallBanner() {
  const { canInstall, install, isInstalling } = usePWAInstall()
  const [dismissed, setDismissed]             = useState(false)

  if (!canInstall || dismissed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="bg-card border rounded-xl shadow-lg p-4 flex items-start gap-3">

        {/* Icon */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Download className="h-5 w-5 text-primary-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Install Aplikasi</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Install POS App untuk akses lebih cepat & offline
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={install}
              disabled={isInstalling}
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setDismissed(true)}
            >
              Nanti
            </Button>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}