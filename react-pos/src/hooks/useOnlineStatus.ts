import { useEffect, useState } from 'react'
import { useQueryClient }      from '@tanstack/react-query'
import { toast }               from 'sonner'

export function useOnlineStatus() {
  const [isOnline, setIsOnline]   = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  const queryClient               = useQueryClient()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)

      if (wasOffline) {
        toast.success('Koneksi kembali! Menyinkronkan data...', {
          duration: 3000,
        })
        // Refetch semua queries yang stale
        queryClient.invalidateQueries()
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      toast.warning('Anda sedang offline. Data akan disimpan secara lokal.', {
        duration: 0, // persisten sampai online
        id      : 'offline-toast',
      })
    }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline, queryClient])

  return { isOnline }
}