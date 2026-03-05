/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card, CardContent,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { apiClient } from '@/api/client'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

const ORDER_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Diproses' },
  { value: 'cooking', label: 'Dimasak' },
  { value: 'ready', label: 'Siap' },
  { value: '', label: 'Semua' },
]

export function Component() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('pending')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cashier-all-orders', tab],
    queryFn: async () => {
      const { data } = await apiClient.get('/cashier/orders', {
        params: { status: tab || undefined, per_page: 40 },
      })
      return data.data
    },
    refetchInterval: 15_000,
  })

  const orders = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daftar Pesanan</h1>
          <p className="text-muted-foreground text-sm">Kelola semua pesanan</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/cashier/orders/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Pesanan Baru
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5">
          {ORDER_TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Belum ada pesanan dalam kategori ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <Card
              key={order.id}
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => navigate(`/cashier/orders/${order.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-mono text-sm font-semibold">{order.order_code}</p>
                      <StatusBadge status={order.status} type="order" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.customer?.name || 'Pelanggan Umum'} · {order.items?.length || 0} item
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatRupiah(order.total_price)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

Component.displayName = 'CashierOrdersPage'
