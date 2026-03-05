/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/shared/OfflineSyncStatus.tsx
import { useEffect, useState }   from 'react'
import { CloudOff, CloudUpload } from 'lucide-react'
import { offlineOrdersDB }       from '@/lib/db'
import { setupOnlineSyncListener } from '@/lib/backgroundSync'
import { toast }                 from 'sonner'

export default function OfflineSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing]       = useState(false)
  const [lastSync, setLastSync]         = useState<Date | null>(null)

  // Check pending orders
  const checkPending = async () => {
    const pending = await offlineOrdersDB.getPending()
    setPendingCount(pending.length)
  }

  useEffect(() => {
    (async () => {
      await checkPending()
    })()

    // Polling setiap 30 detik
    const interval = setInterval(checkPending, 30_000)

    // Setup listener untuk auto sync saat online
    const cleanup = setupOnlineSyncListener(async (result) => {
      setIsSyncing(false)
      setLastSync(new Date())
      await checkPending()

      if (result.success > 0) {
        toast.success(
          `${result.success} pesanan offline berhasil disinkronkan!`
        )
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} pesanan gagal disinkronkan.`)
      }
    })

    return () => {
      clearInterval(interval)
      cleanup()
    }
  }, [])

  // Listen for SW messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'BACKGROUND_SYNC_START') {
        setIsSyncing(true)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [])

  if (pendingCount === 0 && !isSyncing) return null

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium
        shadow-lg border transition-all
        ${isSyncing
          ? 'bg-blue-50 border-blue-200 text-blue-700'
          : 'bg-orange-50 border-orange-200 text-orange-700'
        }
      `}>
        {isSyncing ? (
          <>
            <CloudUpload className="h-3.5 w-3.5 animate-bounce" />
            <span>Menyinkronkan...</span>
          </>
        ) : (
          <>
            <CloudOff className="h-3.5 w-3.5" />
            <span>{pendingCount} pesanan menunggu sync</span>
          </>
        )}
      </div>
    </div>
  )
}