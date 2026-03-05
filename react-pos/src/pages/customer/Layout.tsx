import {
  UtensilsCrossed, ShoppingCart, ClipboardList, User,
} from 'lucide-react'
import { Outlet }          from 'react-router-dom'
import { NavLink }         from 'react-router-dom'
import { useCartStore }    from '@/stores/cartStore'
import AppHeader           from '@/components/shared/AppHeader'
import PWAInstallBanner    from '@/components/shared/PWAInstallBanner'
import OfflineSyncStatus   from '@/components/shared/OfflineSyncStatus'
import { cn }              from '@/lib/utils'

const BOTTOM_NAV = [
  { href: '/customer/menu',   label: 'Menu',     icon: UtensilsCrossed },
  { href: '/customer/cart',   label: 'Keranjang', icon: ShoppingCart, showBadge: true },
  { href: '/customer/orders', label: 'Pesanan',  icon: ClipboardList },
  { href: '/customer/profile',label: 'Profil',   icon: User },
]

export default function CustomerLayout() {
  const { totalItems } = useCartStore()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader title="POS Delivery" />

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-40 pb-safe">
        <div className="flex items-stretch h-16">
          {BOTTOM_NAV.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.showBadge && totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </div>
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      <PWAInstallBanner />
      <OfflineSyncStatus />
    </div>
  )
}