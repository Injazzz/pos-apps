/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState }      from 'react'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import {
  Banknote, CreditCard, QrCode,
  Wallet, Loader2, CheckCircle2,
} from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button }    from '@/components/ui/button'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import { Badge }     from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useProcessPayment } from '@/hooks/usePayment'
import type { Order } from '@/types'

// ─── Payment Methods ──────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    value: 'cash',
    label: 'Tunai',
    icon : <Banknote className="h-5 w-5" />,
    color: 'bg-green-50 border-green-200 text-green-700',
  },
  {
    value: 'qris',
    label: 'QRIS',
    icon : <QrCode className="h-5 w-5" />,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    value: 'transfer_bank',
    label: 'Transfer Bank',
    icon : <CreditCard className="h-5 w-5" />,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  {
    value: 'down_payment',
    label: 'Uang Muka (DP)',
    icon : <Wallet className="h-5 w-5" />,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
  },
] as const

type PaymentMethodValue = typeof PAYMENT_METHODS[number]['value']

// ─── Schemas per method ───────────────────────────────────────
const cashSchema = z.object({
  method       : z.literal('cash'),
  cash_received: z.coerce.number().min(1, 'Wajib diisi'),
})

const transferSchema = z.object({
  method   : z.literal('transfer_bank'),
  bank_name: z.string().min(1, 'Nama bank wajib diisi'),
})

const dpSchema = z.object({
  method   : z.literal('down_payment'),
  dp_amount: z.coerce.number().min(1000, 'DP minimal Rp 1.000'),
})

const baseSchema = z.object({
  method: z.string(),
})

// ─── Formatter ────────────────────────────────────────────────
function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style   : 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Props ────────────────────────────────────────────────────
interface PaymentModalProps {
  order   : Order
  open    : boolean
  onClose : () => void
  onSuccess?: () => void
}

// ─── Component ────────────────────────────────────────────────
export default function PaymentModal({
  order,
  open,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodValue>('cash')
  const [cashInput, setCashInput]   = useState('')
  const [dpInput, setDpInput]       = useState('')
  const [bankName, setBankName]     = useState('')
  const [isDone, setIsDone]         = useState(false)

  const processPayment = useProcessPayment(order.id)

  const totalPrice  = order.total_price
  const cashAmount  = parseFloat(cashInput) || 0
  const dpAmount    = parseFloat(dpInput)   || 0
  const change      = cashAmount - totalPrice
  const remaining   = totalPrice - dpAmount

  const canSubmit = (): boolean => {
    switch (selectedMethod) {
      case 'cash':          return cashAmount >= totalPrice
      case 'transfer_bank': return bankName.trim().length > 0
      case 'down_payment':  return dpAmount > 0 && dpAmount < totalPrice
      case 'qris':          return true
      default:              return false
    }
  }

  const handleSubmit = () => {
    const payload: any = {
      method: selectedMethod,
      amount: totalPrice,
    }

    switch (selectedMethod) {
      case 'cash':
        payload.cash_received = cashAmount
        break
      case 'transfer_bank':
        payload.bank_name = bankName
        break
      case 'down_payment':
        payload.dp_amount = dpAmount
        break
    }

    processPayment.mutate(payload, {
      onSuccess: () => {
        setIsDone(true)
        setTimeout(() => {
          onSuccess?.()
          onClose()
          setIsDone(false)
        }, 1500)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Proses Pembayaran
            <Badge variant="outline" className="text-xs font-mono">
              {order.order_code}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isDone ? (
          // ── Success State ────────────────────────────────────
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-semibold text-lg">Pembayaran Berhasil!</p>
            <p className="text-sm text-muted-foreground">
              {formatRupiah(totalPrice)} via{' '}
              {PAYMENT_METHODS.find(m => m.value === selectedMethod)?.label}
            </p>
          </div>
        ) : (
          <>
            {/* ── Total ──────────────────────────────────────── */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Tagihan
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                <span>{order.items?.length ?? 0} item</span>
                <span>{order.order_type_label}</span>
              </div>
            </div>

            {/* ── Method Selection ───────────────────────────── */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Metode Pembayaran</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setSelectedMethod(method.value)}
                    className={`
                      flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2
                      text-sm font-medium transition-all
                      ${selectedMethod === method.value
                        ? `${method.color} border-current`
                        : 'border-border bg-background hover:bg-muted/50'
                      }
                    `}
                  >
                    {method.icon}
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* ── Method-specific fields ─────────────────────── */}

            {/* CASH */}
            {selectedMethod === 'cash' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cash">Uang Diterima</Label>
                  <Input
                    id="cash"
                    type="number"
                    placeholder="Masukkan jumlah uang"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    className="text-lg font-mono"
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {[totalPrice, 50000, 100000, 150000, 200000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setCashInput(String(amount))}
                      className="px-2.5 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 transition-colors font-medium"
                    >
                      {amount === totalPrice ? 'Pas' : formatRupiah(amount)}
                    </button>
                  ))}
                </div>

                {/* Kembalian */}
                {cashAmount >= totalPrice && (
                  <div className="flex justify-between items-center bg-green-50 rounded-lg p-3">
                    <span className="text-sm text-green-700 font-medium">
                      Kembalian
                    </span>
                    <span className="text-lg font-bold text-green-700">
                      {formatRupiah(change)}
                    </span>
                  </div>
                )}
                {cashAmount > 0 && cashAmount < totalPrice && (
                  <div className="flex justify-between items-center bg-red-50 rounded-lg p-3">
                    <span className="text-sm text-red-600 font-medium">
                      Kurang
                    </span>
                    <span className="font-bold text-red-600">
                      {formatRupiah(totalPrice - cashAmount)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TRANSFER BANK */}
            {selectedMethod === 'transfer_bank' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bank">Nama Bank</Label>
                  <Input
                    id="bank"
                    placeholder="cth: BCA, Mandiri, BRI..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                  <p className="font-medium mb-1">Info Transfer:</p>
                  <p>BCA: 1234567890 a.n. POS Resto</p>
                  <p>Mandiri: 0987654321 a.n. POS Resto</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Kasir akan konfirmasi setelah bukti transfer diterima
                </p>
              </div>
            )}

            {/* QRIS */}
            {selectedMethod === 'qris' && (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-40 h-40 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan QR code di atas menggunakan aplikasi pembayaran
                </p>
                <p className="text-xs text-muted-foreground">
                  * Kasir konfirmasi setelah pembayaran masuk
                </p>
              </div>
            )}

            {/* DOWN PAYMENT */}
            {selectedMethod === 'down_payment' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dp">Jumlah DP</Label>
                  <Input
                    id="dp"
                    type="number"
                    placeholder="Masukkan jumlah DP"
                    value={dpInput}
                    onChange={(e) => setDpInput(e.target.value)}
                    className="font-mono"
                  />
                </div>

                {dpAmount > 0 && dpAmount < totalPrice && (
                  <div className="space-y-1.5 bg-orange-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-700">DP Dibayar:</span>
                      <span className="font-semibold text-orange-700">
                        {formatRupiah(dpAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">Sisa:</span>
                      <span className="font-semibold text-orange-600">
                        {formatRupiah(remaining)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!isDone && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || processPayment.isPending}
              className="min-w-30"
            >
              {processPayment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konfirmasi Bayar'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}