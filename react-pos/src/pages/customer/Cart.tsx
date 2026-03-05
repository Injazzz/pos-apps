/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState }       from 'react'
import { useNavigate }    from 'react-router-dom'
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowRight,
} from 'lucide-react'
import { Button }         from '@/components/ui/button'
import { Input }          from '@/components/ui/input'
import { Separator }      from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label }          from '@/components/ui/label'
import { Textarea }       from '@/components/ui/textarea'
import { useCartStore }   from '@/stores/cartStore'
import { useCreateOrder } from '@/hooks/useOfflineOrder'
import { useAuthStore }   from '@/stores/authStore'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

export function Component() {
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const {
    items, total, updateQty, removeItem, clearCart,
  } = useCartStore()

  const createOrder  = useCreateOrder('customer')
  const [orderType, setOrderType]   = useState('dine_in')
  const [address, setAddress]       = useState(
    user?.customer?.address ?? ''
  )
  const [notes, setNotes]           = useState('')

  const deliveryFee  = orderType === 'delivery' ? 10000 : 0
  const grandTotal   = total + deliveryFee

  const handleCheckout = () => {
    const payload = {
      order_type      : orderType as any,
      items           : items.map(i => ({
        menu_id: i.menu_id,
        qty    : i.qty,
        note   : i.note,
      })),
      delivery_address: orderType === 'delivery' ? address : undefined,
      notes           : notes || undefined,
    }

    createOrder.mutate(payload, {
      onSuccess: ({ data }) => {
        clearCart()
        navigate(`/customer/orders/${data.id}`)
      },
    })
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-4">
        <div className="text-6xl">🛒</div>
        <h2 className="font-bold text-lg">Keranjang Kosong</h2>
        <p className="text-muted-foreground text-sm text-center">
          Tambahkan menu favoritmu untuk mulai memesan
        </p>
        <Button onClick={() => navigate('/customer/menu')}>
          Lihat Menu
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">Keranjang</h1>

      {/* Items */}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.menu_id} className="flex gap-3 p-3 rounded-xl bg-card border">
            {/* Image */}
            <div className="w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden">
              {item.menu.image_url ? (
                <img
                  src={item.menu.image_url}
                  alt={item.menu.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  🍽️
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-tight">
                {item.menu.name}
              </p>
              <p className="text-xs text-primary font-semibold mt-0.5">
                {formatRupiah(item.menu.price)}
              </p>

              {/* Qty controls */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="icon" variant="outline"
                  className="h-7 w-7"
                  onClick={() => updateQty(item.menu_id, item.qty - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">
                  {item.qty}
                </span>
                <Button
                  size="icon" variant="outline"
                  className="h-7 w-7"
                  onClick={() => updateQty(item.menu_id, item.qty + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  size="icon" variant="ghost"
                  className="h-7 w-7 text-destructive ml-auto"
                  onClick={() => removeItem(item.menu_id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Subtotal */}
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold">
                {formatRupiah(item.menu.price * item.qty)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Order Options */}
      <div className="space-y-3">
        <div>
          <Label>Tipe Pesanan</Label>
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dine_in">🍽️ Makan di Tempat</SelectItem>
              <SelectItem value="take_away">🥡 Bawa Pulang</SelectItem>
              <SelectItem value="delivery">🚚 Delivery (+{formatRupiah(10000)})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {orderType === 'delivery' && (
          <div>
            <Label>Alamat Pengiriman</Label>
            <Textarea
              placeholder="Masukkan alamat lengkap..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
        )}

        <div>
          <Label>Catatan (opsional)</Label>
          <Input
            placeholder="cth: Tidak pedas, sambal terpisah..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <Separator />

      {/* Summary */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal ({items.length} item)</span>
          <span>{formatRupiah(total)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Ongkos Kirim</span>
            <span>{formatRupiah(deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-1 border-t">
          <span>Total</span>
          <span className="text-primary">{formatRupiah(grandTotal)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <Button
        className="w-full h-12 text-base font-semibold"
        onClick={handleCheckout}
        disabled={
          createOrder.isPending ||
          (orderType === 'delivery' && !address.trim())
        }
      >
        {createOrder.isPending ? (
          'Memproses...'
        ) : (
          <>
            <ShoppingBag className="mr-2 h-5 w-5" />
            Pesan Sekarang — {formatRupiah(grandTotal)}
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  )
}