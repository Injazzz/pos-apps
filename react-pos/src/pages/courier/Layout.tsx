import { Truck, User } from 'lucide-react'
import DashboardLayout  from '@/components/shared/DashboardLayout'
import type { NavItem } from '@/components/shared/Sidebar'

const NAV_ITEMS: NavItem[] = [
  { label: 'Pengiriman', href: '/courier/deliveries', icon: Truck },
  { label: 'Profil',     href: '/courier/profile',    icon: User },
]

export default function CourierLayout() {
  return <DashboardLayout navItems={NAV_ITEMS} title="Kurir" />
}