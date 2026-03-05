import { Badge } from '@/components/ui/badge'

// ─── Order Status ─────────────────────────────────────────────
const orderStatusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }
> = {
  pending    : { label: 'Menunggu',       variant: 'outline',     color: 'text-yellow-600 border-yellow-300 bg-yellow-50' },
  processing : { label: 'Diproses',       variant: 'secondary',   color: 'text-blue-600 border-blue-300 bg-blue-50' },
  cooking    : { label: 'Dimasak',        variant: 'secondary',   color: 'text-orange-600 border-orange-300 bg-orange-50' },
  ready      : { label: 'Siap',           variant: 'default',     color: 'text-green-600 border-green-300 bg-green-50' },
  on_delivery: { label: 'Diantar',        variant: 'default',     color: 'text-purple-600 border-purple-300 bg-purple-50' },
  delivered  : { label: 'Terkirim',       variant: 'default',     color: 'text-teal-600 border-teal-300 bg-teal-50' },
  completed  : { label: 'Selesai',        variant: 'default',     color: 'text-green-700 border-green-400 bg-green-100' },
  cancelled  : { label: 'Dibatalkan',     variant: 'destructive', color: 'text-red-600 border-red-300 bg-red-50' },
}

// ─── Payment Status ───────────────────────────────────────────
const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending : { label: 'Belum Bayar', color: 'text-yellow-600 border-yellow-300 bg-yellow-50' },
  partial : { label: 'DP',         color: 'text-blue-600 border-blue-300 bg-blue-50' },
  paid    : { label: 'Lunas',      color: 'text-green-600 border-green-300 bg-green-50' },
  failed  : { label: 'Gagal',      color: 'text-red-600 border-red-300 bg-red-50' },
  refunded: { label: 'Refund',     color: 'text-purple-600 border-purple-300 bg-purple-50' },
  expired : { label: 'Expired',    color: 'text-gray-600 border-gray-300 bg-gray-50' },
}

// ─── Delivery Status ──────────────────────────────────────────
const deliveryStatusConfig: Record<string, { label: string; color: string }> = {
  waiting   : { label: 'Menunggu Kurir', color: 'text-yellow-600 border-yellow-300 bg-yellow-50' },
  assigned  : { label: 'Kurir Assigned', color: 'text-blue-600 border-blue-300 bg-blue-50' },
  picked_up : { label: 'Diambil Kurir',  color: 'text-orange-600 border-orange-300 bg-orange-50' },
  on_the_way: { label: 'Dalam Perjalanan', color: 'text-purple-600 border-purple-300 bg-purple-50' },
  delivered : { label: 'Terkirim',       color: 'text-green-600 border-green-300 bg-green-50' },
  failed    : { label: 'Gagal Kirim',    color: 'text-red-600 border-red-300 bg-red-50' },
}

// ─── Components ───────────────────────────────────────────────

interface StatusBadgeProps {
  status: string
  type?: 'order' | 'payment' | 'delivery'
  className?: string
}

export function StatusBadge({ status, type = 'order', className }: StatusBadgeProps) {
  const config = type === 'order'
    ? orderStatusConfig[status]
    : type === 'payment'
      ? paymentStatusConfig[status]
      : deliveryStatusConfig[status]

  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={`${config.color} border font-medium ${className ?? ''}`}
    >
      {config.label}
    </Badge>
  )
}

// ─── Dot indicator ────────────────────────────────────────────
interface StatusDotProps {
  status: string
  type?: 'order' | 'payment' | 'delivery'
}

export function StatusDot({ status }: StatusDotProps) {
  const dotColors: Record<string, string> = {
    // Order statuses
    pending:     'bg-yellow-400',
    processing:  'bg-blue-400',
    cooking:     'bg-orange-400',
    ready:       'bg-green-400',
    on_delivery: 'bg-purple-400',
    delivered:   'bg-teal-400',
    completed:   'bg-green-600',
    cancelled:   'bg-red-400',

    // Payment statuses
    paid:        'bg-green-400',
    failed:      'bg-red-400',

    // Delivery statuses
    waiting:     'bg-yellow-400',
    assigned:    'bg-blue-400',
    picked_up:   'bg-orange-400',
    on_the_way:  'bg-purple-400',
  }

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${dotColors[status] ?? 'bg-gray-400'}`}
    />
  )
}

export default StatusBadge
