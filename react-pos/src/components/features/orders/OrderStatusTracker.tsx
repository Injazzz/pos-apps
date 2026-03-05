import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'
import { useOrderChannel } from '@/hooks/useWebSocket'
import { useQuery }        from '@tanstack/react-query'
import { ordersApi }       from '@/api/orders'

interface Step {
  key    : string
  label  : string
  icon   : React.ReactNode
}

const ORDER_STEPS: Step[] = [
  { key: 'pending',     label: 'Menunggu',       icon: <Clock className="h-4 w-4" /> },
  { key: 'processing',  label: 'Dikonfirmasi',   icon: <Circle className="h-4 w-4" /> },
  { key: 'cooking',     label: 'Dimasak',        icon: <Circle className="h-4 w-4" /> },
  { key: 'ready',       label: 'Siap',           icon: <Circle className="h-4 w-4" /> },
  { key: 'on_delivery', label: 'Diantar',        icon: <Circle className="h-4 w-4" /> },
  { key: 'delivered',   label: 'Terkirim',       icon: <Circle className="h-4 w-4" /> },
  { key: 'completed',   label: 'Selesai',        icon: <CheckCircle2 className="h-4 w-4" /> },
]

const STEP_ORDER = ORDER_STEPS.map(s => s.key)

interface Props {
  orderId  : number
  userRole?: string
}

export default function OrderStatusTracker({ orderId, userRole }: Props) {
  // Subscribe ke realtime updates untuk order ini
  useOrderChannel(orderId)

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn : async () => {
      const endpoint = userRole === 'pelanggan' ? ordersApi.customer : ordersApi.cashier
      const { data } = await endpoint.getOne(orderId)
      return data.data
    },
    refetchInterval: 30_000, // fallback polling setiap 30 detik
  })

  if (isLoading || !data) {
    return (
      <div className="flex gap-2 animate-pulse">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-8 w-16 bg-muted rounded" />
        ))}
      </div>
    )
  }

  const currentStatus = data.status
  const isCancelled   = currentStatus === 'cancelled'

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="font-medium text-sm">Pesanan Dibatalkan</span>
      </div>
    )
  }

  const currentIdx = STEP_ORDER.indexOf(currentStatus)

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative flex items-center justify-between mb-2">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2" />

        {/* Active line */}
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-700"
          style={{
            width: `${(currentIdx / (STEP_ORDER.length - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        {ORDER_STEPS.map((step, idx) => {
          const isDone    = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isPending = idx > currentIdx

          return (
            <div
              key={step.key}
              className="relative flex flex-col items-center gap-1.5 z-10"
            >
              {/* Circle */}
              <div
                className={`
                  flex items-center justify-center w-7 h-7 rounded-full border-2
                  transition-all duration-300
                  ${isDone
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary border-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : 'bg-background border-muted text-muted-foreground'
                  }
                `}
              >
                {isDone
                  ? <CheckCircle2 className="h-4 w-4" />
                  : isCurrent
                  ? <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  : <Circle className="h-3 w-3" />
                }
              </div>

              {/* Label */}
              <span
                className={`
                  text-[10px] font-medium text-center leading-tight
                  ${isCurrent ? 'text-primary' : isPending ? 'text-muted-foreground' : 'text-foreground'}
                `}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}