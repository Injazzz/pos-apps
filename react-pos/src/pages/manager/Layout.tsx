import {
  LayoutDashboard, Users, UtensilsCrossed,
  ShoppingBag, BarChart3, ActivitySquare,
} from 'lucide-react'
import DashboardLayout from '@/components/shared/DashboardLayout'
import type { NavItem } from '@/components/shared/Sidebar'

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',      href: '/manager/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Semua Pesanan',  href: '/manager/orders',    icon: ShoppingBag },
  { label: 'Manajemen Menu', href: '/manager/menus',     icon: UtensilsCrossed },
  { label: 'Manajemen User', href: '/manager/users',     icon: Users },
  { label: 'Laporan',        href: '/manager/reports',   icon: BarChart3 },
  { label: 'Activity Log',   href: '/manager/logs',      icon: ActivitySquare },
]

export default function ManagerLayout() {
  return <DashboardLayout navItems={NAV_ITEMS} title="Manager Panel" />
}