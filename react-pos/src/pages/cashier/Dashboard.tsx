/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState }      from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Bell } from 'lucide-react'
import { useNavigate }   from 'react-router-dom'
import { Button }        from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton }      from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge }   from '@/components/shared/StatusBadge'
import PaymentModal      from '@/components/features/payment/PaymentModal'
import PrintReceiptButton from '@/components/features/receipt/PrintReceiptButton'
import { apiClient }     from '@/api/client'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale }      from 'date-fns/locale'

const ORDER_TABS = [
  { value: 'pending',    label: 'Pending' },
  { value: 'processing', label: 'Diproses' },
  { value: 'cooking',    label: 'Dimasak' },
  { value: 'ready',      label: 'Siap' },
  { value: '',           label: 'Semua' },
]

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

export function Component() {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [tab, setTab]= useState('pending')
  const [payOrder, setPayOrder] = useState<any>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cashier-orders', tab],
    queryFn : async () => {
      const { data } = await apiClient.get('/cashier/orders', {
        params: { status: tab || undefined, per_page: 20 },
      })
      return data.data
    },
    refetchInterval: 15_000,
  })

  const orders = data?.data ?? []

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Order Monitor</h1>
          <p className="text-xs text-muted-foreground">
            Live update setiap 15 detik
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/cashier/orders/new')}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Order Baru
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {ORDER_TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>Tidak ada order {tab ? `dengan status "${tab}"` : ''}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order: any) => (
                <CashierOrderCard
                  key={order.id}
                  order={order}
                  onPay={() => setPayOrder(order)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      {payOrder && (
        <PaymentModal
          order={payOrder}
          open={!!payOrder}
          onClose={() => setPayOrder(null)}
          onSuccess={() => {
            setPayOrder(null)
            queryClient.invalidateQueries({ queryKey: ['cashier-orders'] })
          }}
        />
      )}
    </div>
  )
}

// ─── Order Card for Kasir ─────────────────────────────────────
function CashierOrderCard({
  order, onPay,
}: { order: any; onPay: () => void }) {
  const navigate = useNavigate()

  const isPending    = order.status === 'pending'
  const isReady      = order.status === 'ready'
  const needsPayment = !order.payment || order.payment.status !== 'paid'

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isPending ? 'border-yellow-200 bg-yellow-50/30' : ''
      }`}
      onClick={() => navigate(`/cashier/orders/${order.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {order.order_code}
            </p>
            <p className="font-semibold text-sm mt-0.5 truncate">
              {order.customer_name}
            </p>
          </div>
          <StatusBadge status={order.status} type="order" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Items preview */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          {(order.items ?? []).slice(0, 3).map((item: any) => (
            <div key={item.id} className="flex justify-between">
              <span className="truncate">{item.menu?.name}</span>
              <span className="ml-2 shrink-0">×{item.qty}</span>
            </div>
          ))}
          {(order.items ?? []).length > 3 && (
            <p className="text-muted-foreground">
              +{order.items.length - 3} item lainnya
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t">
          <span className="font-bold text-sm">
            {formatRupiah(order.total_price)}
          </span>
          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
            {needsPayment && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={onPay}
              >
                Bayar
              </Button>
            )}
            <PrintReceiptButton
              orderId={order.id}
              size="sm"
              variant="outline"
              label=""
            />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(order.created_at), {
            addSuffix: true, locale: idLocale,
          })}
        </p>
      </CardContent>
    </Card>
  )
}