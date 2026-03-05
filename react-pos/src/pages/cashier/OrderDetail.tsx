/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, Printer } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { apiClient } from '@/api/client'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import PaymentModal from '@/components/features/payment/PaymentModal'
import { useState } from 'react'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

export function Component() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPayment, setShowPayment] = useState(false)

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/${id}`)
      return data.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Pesanan tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{order.order_code}</h1>
          <p className="text-muted-foreground text-sm">
            {formatDistanceToNow(new Date(order.created_at), {
              addSuffix: true,
              locale: idLocale,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Item Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(order.items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.menu?.name}</p>
                      <p className="text-sm text-muted-foreground">x{item.qty}</p>
                      {item.note && <p className="text-xs text-muted-foreground italic mt-1">Catatan: {item.note}</p>}
                    </div>
                    <p className="font-semibold">{formatRupiah(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={order.status} type="order" />
                </div>
                {order.status_logs && order.status_logs.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold mb-3">Riwayat Status</p>
                    <div className="space-y-2">
                      {order.status_logs.map((log: any) => (
                        <div key={log.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{log.status}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.updated_at), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Side */}
        <div className="space-y-4">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-semibold">{order.customer?.name || 'Umum'}</p>
                </div>
                {order.customer?.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telepon</p>
                    <p className="font-semibold">{order.customer.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={order.payment?.status || 'pending'} type="payment" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Metode</p>
                <p className="font-semibold">{order.payment?.method || 'Belum ditentukan'}</p>
              </div>
              {order.payment?.status === 'pending' && (
                <Button
                  className="w-full"
                  onClick={() => setShowPayment(true)}
                >
                  Proses Pembayaran
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatRupiah(order.total_price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Pajak</span>
                <span>Rp 0</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span>{formatRupiah(order.total_price)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          open={showPayment}
          order={order}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['order', id] })
            setShowPayment(false)
          }}
        />
      )}
    </div>
  )
}

Component.displayName = 'CashierOrderDetailPage'
