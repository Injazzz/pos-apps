/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, Truck, MapPin } from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge, StatusDot } from '@/components/shared/StatusBadge'
import { apiClient } from '@/api/client'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

export function Component() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['customer-order', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/customer/orders/${id}`)
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{order.order_code}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Order Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-semibold text-sm">Status Saat Ini</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {formatDistanceToNow(new Date(order.created_at), {
                    addSuffix: true,
                    locale: idLocale,
                  })}
                </p>
              </div>
              <StatusBadge status={order.status} type="order" />
            </div>

            {order.status_logs && order.status_logs.length > 0 && (
              <div className="mt-6 pt-4 border-t space-y-3">
                {order.status_logs.map((log: any, idx: number) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <StatusDot status={log.status} type="order" />
                      {idx < (order.status_logs?.length ?? 0) - 1 && (
                        <div className="w-0.5 h-8 bg-muted mt-2" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold capitalize">{log.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.updated_at), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(order.items || []).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{item.menu?.name}</p>
                  <p className="text-sm text-muted-foreground">Jumlah: {item.qty}</p>
                  {item.note && <p className="text-xs text-muted-foreground italic mt-1">Catatan: {item.note}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{formatRupiah(item.price)}</p>
                  <p className="font-semibold">{formatRupiah(item.price * item.qty)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Info */}
      {order.delivery && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Informasi Pengiriman
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status Pengiriman</p>
              <StatusBadge status={order.delivery.delivery_status} type="delivery" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Alamat Tujuan
              </p>
              <p className="text-sm">{order.delivery.address}</p>
            </div>
            {order.delivery.courier && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kurir</p>
                <p className="text-sm font-semibold">{order.delivery.courier.name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rincian Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Metode</span>
            <span className="font-semibold capitalize">{order.payment?.method || 'Belum ditentukan'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={order.payment?.status || 'pending'} type="payment" />
          </div>
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">{formatRupiah(order.total_price)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Order Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tipe Pesanan</span>
            <span className="font-semibold capitalize">{order.order_type}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Waktu Pesan</span>
            <span className="text-sm">
              {new Date(order.created_at).toLocaleString('id-ID')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

Component.displayName = 'CustomerOrderDetailPage'
