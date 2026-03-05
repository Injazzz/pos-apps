/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast }                        from 'sonner'
import { offlineOrdersDB }              from '@/lib/db'
import { ordersApi }                    from '@/api/orders'
import { registerBackgroundSync }       from '@/lib/backgroundSync'
import { getApiError }                  from '@/api/client'
import type { CreateOrderPayload }      from '@/types'

export function useCreateOrder(role: 'customer' | 'cashier' = 'cashier') {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {

      // Jika online: langsung POST ke API
      if (navigator.onLine) {
        const api = role === 'customer'
          ? ordersApi.customer
          : ordersApi.cashier

        const { data } = await api.create(payload)
        return { data: data.data, isOffline: false }
      }

      // Jika offline: simpan ke IndexedDB + register bg sync
      const localId = await offlineOrdersDB.add(payload)
      await registerBackgroundSync()

      return {
        data     : { id: localId, order_code: localId, ...payload },
        isOffline: true,
      }
    },

    onSuccess: ({ data, isOffline }) => {
      if (isOffline) {
        toast.warning(
          'Anda sedang offline. Pesanan akan dikirim otomatis saat online.',
          { duration: 5000 }
        )
      } else {
        toast.success('Pesanan berhasil dibuat!')
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['customer-orders'] })
      }
    },

    onError: (error) => {
      toast.error(getApiError(error))
    },
  })
}