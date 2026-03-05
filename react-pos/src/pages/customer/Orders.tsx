/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate }    from 'react-router-dom'
import { useQuery }       from '@tanstack/react-query'
import { ClipboardList }  from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton }       from '@/components/ui/skeleton'
import { StatusBadge }    from '@/components/shared/StatusBadge'
import { ordersApi }      from '@/api/orders'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale }      from 'date-fns/locale'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

export function Component() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['customer-orders'],
    queryFn : async () => {
      const { data } = await ordersApi.customer.getAll()
      return data.data.data
    },
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-3">
        {[1,2,3,4].map(i => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-3">
        <ClipboardList className="h-12 w-12 text-muted-foreground opacity-30" />
        <p className="font-semibold">Belum ada pesanan</p>
        <p className="text-sm text-muted-foreground text-center">
          Mulai pesan makanan favoritmu sekarang
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <h1 className="text-xl font-bold">Pesanan Saya</h1>
      {data.map((order: any) => (
        <Card
          key={order.id}
          className="cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate(`/customer/orders/${order.id}`)}
        >
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {order.order_code}
                </p>
                <p className="font-semibold text-sm mt-0.5">
                  {order.items?.length ?? 0} item
                </p>
              </div>
              <StatusBadge status={order.status} type="order" />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-primary">
                {formatRupiah(order.total_price)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at), {
                  addSuffix: true, locale: idLocale,
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}