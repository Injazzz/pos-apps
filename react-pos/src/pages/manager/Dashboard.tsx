/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/manager/Dashboard.tsx
import { useQuery }          from '@tanstack/react-query'
import {
  ShoppingBag, Users, TrendingUp,
  Clock, RefreshCw,
} from 'lucide-react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button }            from '@/components/ui/button'
import { Skeleton }          from '@/components/ui/skeleton'
import { apiClient }         from '@/api/client'
import { StatusBadge }       from '@/components/shared/StatusBadge'
import { useDashboardPresence } from '@/hooks/useWebSocket'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale }    from 'date-fns/locale'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({
  title, value, sub, icon: Icon, color, loading,
}: {
  title: string; value: string | number; sub?: string
  icon: any; color: string; loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading
            ? <Skeleton className="h-7 w-24 mt-1" />
            : <p className="text-2xl font-bold">{value}</p>
          }
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function Component() {
  useDashboardPresence()

  const { data: summary, isLoading, refetch } = useQuery({
    queryKey : ['manager', 'summary'],
    queryFn  : async () => {
      const { data } = await apiClient.get('/manager/reports/summary')
      return data.data
    },
    refetchInterval: 60_000,
  })

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey : ['manager', 'recent-orders'],
    queryFn  : async () => {
      const { data } = await apiClient.get('/manager/orders', {
        params: { per_page: 8, page: 1 },
      })
      return data.data.data
    },
    refetchInterval: 30_000,
  })

  const today = summary?.today ?? {}
  const overall = summary?.overall ?? {}

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Selamat datang kembali! Ini ringkasan hari ini.
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pesanan Hari Ini"
          value={today.total_orders ?? 0}
          sub={`${today.pending_orders ?? 0} pending`}
          icon={ShoppingBag}
          color="bg-blue-100 text-blue-600"
          loading={isLoading}
        />
        <StatCard
          title="Pendapatan Hari Ini"
          value={formatRupiah(today.total_revenue ?? 0)}
          sub="dari pesanan selesai"
          icon={TrendingUp}
          color="bg-green-100 text-green-600"
          loading={isLoading}
        />
        <StatCard
          title="Order Aktif"
          value={today.active_orders ?? 0}
          sub="sedang diproses"
          icon={Clock}
          color="bg-orange-100 text-orange-600"
          loading={isLoading}
        />
        <StatCard
          title="Total Pelanggan"
          value={overall.total_customers ?? 0}
          sub="terdaftar"
          icon={Users}
          color="bg-purple-100 text-purple-600"
          loading={isLoading}
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
              <CardDescription>
                Update realtime setiap 30 detik
              </CardDescription>
            </div>
            <Button
              variant="ghost" size="sm"
              onClick={() => window.location.href = '/manager/orders'}
            >
              Lihat Semua
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(recentOrders ?? []).map((order: any) => (
                <OrderRow key={order.id} order={order} />
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Belum ada pesanan hari ini
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function OrderRow({ order }: { order: any }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => window.location.href = `/manager/orders/${order.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium">
            {order.order_code}
          </span>
          <StatusBadge status={order.status} type="order" />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {order.customer_name} •{' '}
          {formatDistanceToNow(new Date(order.created_at), {
            addSuffix: true, locale: idLocale,
          })}
        </p>
      </div>
      <span className="text-sm font-semibold shrink-0">
        {formatRupiah(order.total_price)}
      </span>
    </div>
  )
}