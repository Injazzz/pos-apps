import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast }           from 'sonner'
import { paymentsApi, type CreatePaymentPayload } from '@/api/payments'
import { openSnapPayment, type MidtransResult }   from '@/lib/midtrans'
import { getApiError }     from '@/api/client'

// ─── Keys ─────────────────────────────────────────────────────
export const paymentKeys = {
  byOrder: (orderId: number) => ['payment', 'order', orderId] as const,
}

// ─── useOrderPayment ─────────────────────────────────────────
export function useOrderPayment(orderId: number) {
  return useQuery({
    queryKey: paymentKeys.byOrder(orderId),
    queryFn : async () => {
      const { data } = await paymentsApi.getOrderPayment(orderId)
      return data.data
    },
    enabled: !!orderId,
  })
}

// ─── useProcessPayment (Kasir) ───────────────────────────────
export function useProcessPayment(orderId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) =>
      paymentsApi.processPayment(orderId, payload),

    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.setQueryData(
        paymentKeys.byOrder(orderId),
        data.data
      )
      toast.success('Pembayaran berhasil diproses!')
    },

    onError: (error) => {
      toast.error(getApiError(error))
    },
  })
}

// ─── useConfirmTransfer (Kasir) ──────────────────────────────
export function useConfirmTransfer(orderId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file?: File) => {
      const formData = new FormData()
      if (file) formData.append('transfer_proof', file)
      return paymentsApi.confirmTransfer(orderId, formData)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      toast.success('Transfer berhasil dikonfirmasi!')
    },

    onError: (error) => {
      toast.error(getApiError(error))
    },
  })
}

// ─── useMidtransPayment (Customer) ───────────────────────────
export function useMidtransPayment(orderId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (callbacks: {
      onSuccess?: (result: MidtransResult) => void
      onPending?: (result: MidtransResult) => void
      onClose?  : () => void
    }) => {
      // 1. Minta snap token dari backend
      const { data } = await paymentsApi.createSnapToken(orderId)
      const { snap_token } = data.data

      // 2. Buka popup Midtrans
      await openSnapPayment(snap_token, {
        onSuccess: (result) => {
          toast.success('Pembayaran berhasil!')
          queryClient.invalidateQueries({ queryKey: ['customer-orders'] })
          queryClient.invalidateQueries({ queryKey: ['order', orderId] })
          callbacks.onSuccess?.(result)
        },
        onPending: (result) => {
          toast.info('Pembayaran sedang diproses...')
          callbacks.onPending?.(result)
        },
        onError: () => {
          toast.error('Pembayaran gagal. Silakan coba lagi.')
        },
        onClose: () => {
          toast.warning('Pembayaran dibatalkan.')
          callbacks.onClose?.()
        },
      })

      return data.data
    },

    onError: (error) => {
      toast.error(getApiError(error))
    },
  })
}