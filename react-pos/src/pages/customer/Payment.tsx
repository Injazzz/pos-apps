import { useState }       from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery }       from '@tanstack/react-query'
import {
  CreditCard, Loader2, ShieldCheck,
  Clock, CheckCircle2, AlertCircle,
} from 'lucide-react'

import { Button }  from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }   from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ordersApi }        from '@/api/orders'
import { useMidtransPayment } from '@/hooks/usePayment'

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style   : 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CustomerPaymentPage() {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const orderId     = Number(id)
  const snapPayment = useMidtransPayment(orderId)
  const [paymentDone, setPaymentDone] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn : async () => {
      const { data } = await ordersApi.customer.getOne(orderId)
      return data.data
    },
    enabled: !!orderId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="font-semibold">Pesanan tidak ditemukan.</p>
        <Button onClick={() => navigate('/customer/orders')}>
          Kembali ke Pesanan
        </Button>
      </div>
    )
  }

  const isPaid = order.payment?.status === 'paid'

  if (paymentDone || isPaid) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Pembayaran Berhasil!</h2>
          <p className="text-muted-foreground">
            Pesanan {order.order_code} sedang diproses
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => navigate('/customer/orders')}
            >
              Lihat Pesanan
            </Button>
            <Button onClick={() => navigate('/customer/menu')}>
              Pesan Lagi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Pembayaran</h1>
        <p className="text-sm text-muted-foreground">
          Selesaikan pembayaran untuk pesanan Anda
        </p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ringkasan Pesanan</CardTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {order.order_code}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">

          {/* Items */}
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.menu?.name}
                  <span className="ml-1 text-xs">×{item.qty}</span>
                </span>
                <span className="font-medium">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatRupiah(order.subtotal)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Ongkos Kirim</span>
                <span>{formatRupiah(order.delivery_fee)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon</span>
                <span>-{formatRupiah(order.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">
                {formatRupiah(order.total_price)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      {order.payment && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 py-3">
            <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Menunggu Pembayaran
              </p>
              <p className="text-xs text-yellow-600">
                Klik tombol di bawah untuk melanjutkan pembayaran
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-green-500" />
        <span>Pembayaran aman via Midtrans</span>
      </div>

      {/* Pay Button */}
      <Card>
        <CardFooter className="pt-4">
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={() =>
              snapPayment.mutate({
                onSuccess: () => setPaymentDone(true),
              })
            }
            disabled={snapPayment.isPending}
          >
            {snapPayment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuka Pembayaran...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Bayar {formatRupiah(order.total_price)}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Supported Payments */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">Metode yang didukung:</p>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          {['GoPay', 'OVO', 'DANA', 'ShopeePay', 'Transfer Bank', 'Kartu Kredit', 'QRIS'].map(m => (
            <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
          ))}
        </div>
      </div>
    </div>
  )
}