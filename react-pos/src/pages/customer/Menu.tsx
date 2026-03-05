import { useState }         from 'react'
import { useNavigate }      from 'react-router-dom'
import { Search, ShoppingCart, Plus, WifiOff } from 'lucide-react'
import { Input }            from '@/components/ui/input'
import { Button }           from '@/components/ui/button'
import { Badge }            from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useOfflineMenu }   from '@/hooks/useOfflineMenu'
import { useCartStore }     from '@/stores/cartStore'
import { toast }            from 'sonner'
import type { Menu }        from '@/types'

function formatRupiah(v: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

export function Component() {
  const navigate              = useNavigate()
  const { addItem, totalItems } = useCartStore()
  const [search, setSearch]   = useState('')
  const [category, setCategory] = useState('')

  const { data: menus = [], isLoading, isOffline } = useOfflineMenu({
    search, category,
  })

  // Categories from menus
  const categories = ['', ...Array.from(
    new Set((menus as Menu[]).map(m => m.category).filter(Boolean))
  )]

  const handleAdd = (menu: Menu) => {
    if (!menu.is_available) return
    addItem(menu, 1)
    toast.success(`${menu.name} ditambahkan ke keranjang`, {
      duration: 2000,
    })
  }

  return (
    <div className="space-y-0">

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background border-b px-4 py-3 space-y-3">

        {/* Offline indicator */}
        {isOffline && (
          <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
            <WifiOff className="h-3.5 w-3.5" />
            Mode offline — menu dari cache
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari makanan atau minuman..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-muted/50"
          />
        </div>

        {/* Category Pills */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`
                  shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                  transition-all border
                  ${category === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }
                `}
              >
                {cat || 'Semua'}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Menu Grid */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-xl bg-muted animate-pulse aspect-3/4" />
            ))}
          </div>
        ) : (menus as Menu[]).length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🔍</p>
            <p>Menu tidak ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(menus as Menu[]).map(menu => (
              <CustomerMenuCard
                key={menu.id}
                menu={menu}
                onAdd={() => handleAdd(menu)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 right-4 z-30">
          <Button
            className="h-12 px-4 rounded-full shadow-lg gap-2"
            onClick={() => navigate('/customer/cart')}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">Lihat Keranjang</span>
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {totalItems}
            </Badge>
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Customer Menu Card ───────────────────────────────────────
function CustomerMenuCard({
  menu, onAdd,
}: { menu: Menu; onAdd: () => void }) {
  return (
    <div className={`
      rounded-xl overflow-hidden border bg-card shadow-sm
      ${!menu.is_available ? 'opacity-60' : ''}
    `}>
      {/* Image */}
      <div className="aspect-video bg-muted relative">
        {menu.image_url ? (
          <img
            src={menu.image_url}
            alt={menu.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}
        {!menu.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="text-xs">Habis</Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <p className="font-medium text-sm leading-tight line-clamp-2">
            {menu.name}
          </p>
          {menu.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              {menu.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">
            {formatRupiah(menu.price)}
          </span>
          <Button
            size="icon"
            className="h-7 w-7 rounded-full"
            disabled={!menu.is_available}
            onClick={onAdd}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}