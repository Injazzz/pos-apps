import {
  LayoutDashboard, ShoppingBag, PlusCircle,
} from 'lucide-react'
import DashboardLayout  from '@/components/shared/DashboardLayout'
import type { NavItem } from '@/components/shared/Sidebar'

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    href: '/cashier/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Semua Order',  href: '/cashier/orders',    icon: ShoppingBag },
  { label: 'Order Baru',   href: '/cashier/orders/new',icon: PlusCircle },
]

export default function CashierLayout() {
  return <DashboardLayout navItems={NAV_ITEMS} title="Kasir" />
}