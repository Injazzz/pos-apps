/* eslint-disable @typescript-eslint/no-unused-vars */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState }      from 'react'
import { menuCacheDB, type CachedMenu } from '@/lib/db'
import { menusApi }                 from '@/api/menus'
import type { Menu }                from '@/types'

export function useOfflineMenu(params?: {
  category?: string
  search?  : string
}) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const queryClient               = useQueryClient()

  useEffect(() => {
    const handleOnline  = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Query yang aware offline
  const query = useQuery({
    queryKey: ['menus', 'offline', params],

    queryFn: async (): Promise<Menu[]> => {
      // Jika online: fetch dari API + simpan ke IndexedDB
      if (navigator.onLine) {
        try {
          const { data } = await menusApi.getAll({
            category: params?.category,
            search  : params?.search,
          })
          const menus = data.data.data

          // Cache ke IndexedDB
          await menuCacheDB.saveAll(
            menus.map(m => ({
              id          : m.id,
              name        : m.name,
              price       : m.price,
              category    : m.category,
              description : m.description ?? null,
              image_url   : m.image_url ?? '',
              is_available: m.is_available,
              cachedAt    : new Date().toISOString(),
            }))
          )

          return menus
        } catch {
          // API gagal → fallback ke cache
          return getFromCache(params)
        }
      }

      // Offline: ambil dari IndexedDB
      return getFromCache(params)
    },

    staleTime         : 1000 * 60 * 10, // 10 menit
    refetchOnReconnect: true,
  })

  return {
    ...query,
    isOffline,
    isFromCache: isOffline && !!query.data,
  }
}

async function getFromCache(params?: {
  category?: string
  search?  : string
}): Promise<Menu[]> {
  const cached = params?.category
    ? await menuCacheDB.getByCategory(params.category)
    : await menuCacheDB.getAll()

  let result = cached as unknown as Menu[]

  if (params?.search) {
    const keyword = params.search.toLowerCase()
    result = result.filter(
      m => m.name.toLowerCase().includes(keyword) ||
           (m.category ?? '').toLowerCase().includes(keyword)
    )
  }

  return result
}