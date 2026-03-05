/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo }   from 'react'
import { useNavigate }         from 'react-router-dom'
import { Search, Plus, Minus, Trash2, ShoppingCart, Send } from 'lucide-react'
import { Input }               from '@/components/ui/input'
import { Button }              from '@/components/ui/button'
import { Badge }               from '@/components/ui/badge'
import { Label }               from '@/components/ui/label'
import { Textarea }            from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Separator }           from '@/components/ui/separator'
import { useOfflineMenu }      from '@/hooks/useOfflineMenu'
import { useCreateOrder }      from '@/hooks/useOfflineOrder'
import PaymentModal            from '@/components/features/payment/PaymentModal'
import type { Menu }           from '@/types'

interface CartItem {
  menu: Menu
  qty : number
  note: string
}

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

const ORDER_TYPES = [
  { value: 'dine_in',   label: '🍽️ Makan di Tempat' },
  { value: 'take_away', label: '🥡 Bawa Pulang' },
  { value: 'delivery',  label: '🚚 Delivery' },
]

export function Component() {
  const navigate      = useNavigate()
  const createOrder   = useCreateOrder('cashier')
  const [search, setSearch]           = useState('')
  const [category, setCategory]       = useState('')
  const [cartItems, setCartItems]     = useState<CartItem[]>([])
  const [orderType, setOrderType]     = useState('dine_in')
  const [custName, setCustName]       = useState('')
  const [custPhone, setCustPhone]     = useState('')
  const [deliveryAddr, setDeliveryAddr] = useState('')
  const [notes, setNotes]             = useState('')
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [showPayment, setShowPayment] = useState(false)

  const { data: menus = [], isOffline } = useOfflineMenu({ search, category })

  // Unique categories
  const categories = useMemo(() => {
    const all = menus.map((m: any) => m.category).filter(Boolean)
    return ['', ...Array.from(new Set(all))]
  }, [menus])

  // Cart calculations
  const subtotal     = cartItems.reduce(
    (s, i) => s + i.menu.price * i.qty, 0
  )
  const deliveryFee  = orderType === 'delivery' ? 10000 : 0
  const total        = subtotal + deliveryFee

  // Cart helpers
  const addToCart = (menu: Menu) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.menu.id === menu.id)
      if (ex) return prev.map(i => i.menu.id === menu.id
        ? { ...i, qty: i.qty + 1 } : i
      )
      return [...prev, { menu, qty: 1, note: '' }]
    })
  }

  const updateQty = (menuId: number, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(i => i.menu.id === menuId
        ? { ...i, qty: Math.max(0, i.qty + delta) } : i
      )
      return updated.filter(i => i.qty > 0)
    })
  }

  const updateNote = (menuId: number, note: string) => {
    setCartItems(prev =>
      prev.map(i => i.menu.id === menuId ? { ...i, note } : i)
    )
  }

  const handleSubmit = () => {
    if (cartItems.length === 0) return

    const payload = {
      order_type      : orderType as any,
      items           : cartItems.map(i => ({
        menu_id: i.menu.id,
        qty    : i.qty,
        note   : i.note,
      })),
      customer_name   : custName  || undefined,
      customer_phone  : custPhone || undefined,
      delivery_address: orderType === 'delivery' ? deliveryAddr : undefined,
      notes           : notes || undefined,
      source          : 'kasir' as any,
    }

    createOrder.mutate(payload, {
      onSuccess: ({ data }) => {
        setCreatedOrder(data)
        setShowPayment(true)
      },
    })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">

      {/* ── LEFT: Menu List ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari menu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c} value={c}>
                  {c || 'Semua Kategori'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isOffline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-3 text-xs text-yellow-700">
            ⚠️ Mode offline — menampilkan menu dari cache
          </div>
        )}

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {(menus as Menu[]).map(menu => {
              const inCart = cartItems.find(i => i.menu.id === menu.id)
              return (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  qty={inCart?.qty ?? 0}
                  onAdd={() => addToCart(menu)}
                />
              )
            })}
            {menus.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                Tidak ada menu ditemukan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Cart & Order Form ─────────────────────────── */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4">

        {/* Order Type */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label className="text-xs">Tipe Order</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer info */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Nama Customer</Label>
                <Input
                  placeholder="Nama..."
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">No. HP</Label>
                <Input
                  placeholder="08xx..."
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>

            {/* Delivery address */}
            {orderType === 'delivery' && (
              <div>
                <Label className="text-xs">Alamat Pengiriman</Label>
                <Textarea
                  placeholder="Masukkan alamat lengkap..."
                  value={deliveryAddr}
                  onChange={e => setDeliveryAddr(e.target.value)}
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>
            )}

            <div>
              <Label className="text-xs">Catatan</Label>
              <Input
                placeholder="Catatan tambahan..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mt-1 h-8 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Pesanan
              {cartItems.length > 0 && (
                <Badge variant="secondary">
                  {cartItems.reduce((s, i) => s + i.qty, 0)} item
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2 pb-2">
            {cartItems.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Belum ada item dipilih
              </p>
            ) : (
              cartItems.map(item => (
                <div key={item.menu.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {item.menu.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatRupiah(item.menu.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => updateQty(item.menu.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.qty}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => updateQty(item.menu.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={() => updateQty(item.menu.id, -99)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Input
                    placeholder="Catatan item..."
                    value={item.note}
                    onChange={e => updateNote(item.menu.id, e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              ))
            )}
          </CardContent>

          {/* Total & Submit */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Ongkir</span>
                    <span>{formatRupiah(deliveryFee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatRupiah(total)}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={createOrder.isPending || cartItems.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                {createOrder.isPending ? 'Memproses...' : 'Buat Pesanan'}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Payment Modal after order created */}
      {createdOrder && showPayment && (
        <PaymentModal
          order={createdOrder}
          open={showPayment}
          onClose={() => {
            setShowPayment(false)
            navigate('/cashier/dashboard')
          }}
          onSuccess={() => {
            setShowPayment(false)
            navigate('/cashier/dashboard')
          }}
        />
      )}
    </div>
  )
}

// ─── Menu Card ────────────────────────────────────────────────
function MenuCard({
  menu, qty, onAdd,
}: { menu: Menu; qty: number; onAdd: () => void }) {
  return (
    <div
      className={`
        relative rounded-xl border bg-card overflow-hidden
        cursor-pointer transition-all hover:shadow-md active:scale-95
        ${!menu.is_available ? 'opacity-50 pointer-events-none' : ''}
        ${qty > 0 ? 'ring-2 ring-primary' : ''}
      `}
      onClick={onAdd}
    >
      {/* Image */}
      <div className="aspect-square bg-muted relative">
        {menu.image_url ? (
          <img
            src={menu.image_url}
            alt={menu.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            🍽️
          </div>
        )}
        {!menu.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-medium">Habis</span>
          </div>
        )}
        {qty > 0 && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {qty}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium leading-tight line-clamp-2">
          {menu.name}
        </p>
        <p className="text-xs text-primary font-semibold mt-1">
          {formatRupiah(menu.price)}
        </p>
      </div>
    </div>
  )
}