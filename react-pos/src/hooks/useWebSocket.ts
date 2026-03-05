/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react'
import { getEcho } from '@/lib/echo'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { UserRole } from '@/types'

// ─── Types ───────────────────────────────────────────────────
interface OrderCreatedPayload {
  order_id    : number
  order_code  : string
  order_type  : string
  status      : string
  total_price : number
  customer_name: string
  items_count : number
  created_at  : string
}

interface OrderStatusPayload {
  order_id    : number
  order_code  : string
  old_status  : string
  new_status  : string
  status_label: string
  updated_by  : string
  updated_at  : string
}

interface PaymentPayload {
  payment_id  : number
  order_id    : number
  order_code  : string
  method      : string
  method_label: string
  amount      : number
  status      : string
  paid_at     : string
}

interface DeliveryPayload {
  delivery_id    : number
  order_id       : number
  order_code     : string
  delivery_status: string
  status_label   : string
  courier_name   : string
  updated_at     : string
}

// ─── Main WebSocket Hook ─────────────────────────────────────
export function useWebSocket() {
  const { user, isAuthenticated } = useAuthStore()
  const { addNotification }       = useNotificationStore()
  const queryClient               = useQueryClient()
  const listenersRef              = useRef<(() => void)[]>([])

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const echo = getEcho()
    const role = user.role as UserRole

    // ── Role-based channels ──────────────────────────────────
    const setupRoleChannels = () => {
      // Manager & Kasir: subscribe ke order channel
      if (role === 'manager' || role === 'kasir') {
        const managerChannel = echo.private(`role.${role === 'manager' ? 'manager' : 'kasir'}`)

        managerChannel.listen('.order.created', (payload: OrderCreatedPayload) => {
          addNotification({
            type   : 'order_new',
            title  : '🛎️ Pesanan Baru!',
            message: `${payload.order_code} dari ${payload.customer_name} — ${payload.items_count} item`,
            data   : { orderId: payload.order_id },
          })

          toast.success(`Pesanan baru: ${payload.order_code}`, {
            description: `${payload.customer_name} • ${payload.items_count} item`,
            duration   : 6000,
            action     : {
              label  : 'Lihat',
              onClick: () => {
                window.location.href = `/${role === 'manager' ? 'manager' : 'cashier'}/orders/${payload.order_id}`
              },
            },
          })

          // Invalidate orders list
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        })

        managerChannel.listen('.order.status.updated', (payload: OrderStatusPayload) => {
          addNotification({
            type   : 'order_status',
            title  : '📦 Status Order Berubah',
            message: `${payload.order_code}: ${payload.status_label}`,
            data   : { orderId: payload.order_id },
          })

          queryClient.invalidateQueries({ queryKey: ['orders'] })
          queryClient.invalidateQueries({
            queryKey: ['order', payload.order_id],
          })
        })

        managerChannel.listen('.payment.received', (payload: PaymentPayload) => {
          addNotification({
            type   : 'payment',
            title  : '💰 Pembayaran Diterima',
            message: `${payload.order_code} — ${payload.method_label}`,
            data   : { orderId: payload.order_id },
          })

          toast.success(`Pembayaran ${payload.order_code} diterima!`)
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        })

        listenersRef.current.push(() => managerChannel.stopListening('.order.created'))
        listenersRef.current.push(() => managerChannel.stopListening('.order.status.updated'))
        listenersRef.current.push(() => managerChannel.stopListening('.payment.received'))
      }

      // Kurir: subscribe ke courier channel
      if (role === 'kurir') {
        const courierChannel = echo.private(`courier.${user.id}`)

        courierChannel.listen('.order.status.updated', (payload: OrderStatusPayload) => {
          addNotification({
            type   : 'order_status',
            title  : '🚚 Update Pesanan',
            message: `${payload.order_code}: ${payload.status_label}`,
            data   : { orderId: payload.order_id },
          })
          queryClient.invalidateQueries({ queryKey: ['deliveries'] })
        })

        listenersRef.current.push(() => courierChannel.stopListening('.order.status.updated'))
      }

      // Pelanggan: subscribe ke customer channel
      if (role === 'pelanggan') {
        const customerChannel = echo.private(`customer.${user.id}`)

        customerChannel.listen('.order.status.updated', (payload: OrderStatusPayload) => {
          addNotification({
            type   : 'order_status',
            title  : '📦 Update Pesanan Anda',
            message: `${payload.order_code} — ${payload.status_label}`,
            data   : { orderId: payload.order_id },
          })

          toast.info(`Pesanan ${payload.order_code}: ${payload.status_label}`, {
            duration: 5000,
          })

          queryClient.invalidateQueries({ queryKey: ['customer-orders'] })
        })

        customerChannel.listen('.delivery.status.updated', (payload: DeliveryPayload) => {
          addNotification({
            type   : 'delivery',
            title  : '🛵 Update Pengiriman',
            message: `${payload.order_code} — ${payload.status_label}`,
            data   : { orderId: payload.order_id },
          })

          toast.info(`Pengiriman ${payload.order_code}: ${payload.status_label}`)
        })

        customerChannel.listen('.payment.received', (payload: PaymentPayload) => {
          addNotification({
            type   : 'payment',
            title  : '✅ Pembayaran Dikonfirmasi',
            message: `Pesanan ${payload.order_code} telah terkonfirmasi`,
            data   : { orderId: payload.order_id },
          })
        })

        listenersRef.current.push(() => {
          customerChannel.stopListening('.order.status.updated')
          customerChannel.stopListening('.delivery.status.updated')
          customerChannel.stopListening('.payment.received')
        })
      }
    }

    setupRoleChannels()

    // Cleanup saat unmount / user berubah
    return () => {
      listenersRef.current.forEach(cleanup => cleanup())
      listenersRef.current = []
    }
  }, [isAuthenticated, user?.id, user?.role])
}

// ─── Hook untuk subscribe ke satu order spesifik ────────────
export function useOrderChannel(orderId: number | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!orderId) return

    const echo    = getEcho()
    const channel = echo.private(`order.${orderId}`)

    channel.listen('.order.status.updated', (payload: OrderStatusPayload) => {
      // Update cache langsung tanpa refetch
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    })

    return () => {
      channel.stopListening('.order.status.updated')
      echo.leave(`order.${orderId}`)
    }
  }, [orderId])
}

// ─── Hook untuk presence channel (siapa yang online) ─────────
export function useDashboardPresence() {
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user?.id) return

    const echo    = getEcho()
    const channel = echo.join('presence.dashboard')

    channel
      .here((members: any[]) => {
        console.log('[Presence] Online now:', members)
      })
      .joining((member: any) => {
        console.log('[Presence] Joined:', member.name)
      })
      .leaving((member: any) => {
        console.log('[Presence] Left:', member.name)
      })

    return () => {
      echo.leave('presence.dashboard')
    }
  }, [user?.id])
}