import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'

export function usePermissions() {
  const { user } = useAuthStore()

  const role = user?.role as UserRole | undefined

  return {
    // Role checkers
    isManager  : role === 'manager',
    isKasir    : role === 'kasir',
    isKurir    : role === 'kurir',
    isPelanggan: role === 'pelanggan',

    // Feature permissions
    canManageUsers   : role === 'manager',
    canManageMenus   : role === 'manager',
    canViewReports   : role === 'manager',
    canPrintReceipt  : role === 'manager' || role === 'kasir',
    canCreateOrder   : role === 'kasir' || role === 'pelanggan' || role === 'manager',
    canProcessPayment: role === 'kasir' || role === 'manager',
    canUpdateDelivery: role === 'kurir' || role === 'manager',
    canAssignCourier : role === 'manager',

    // Status transition permissions per role
    canSetOrderStatus: (status: string): boolean => {
      const allowed: Record<string, string[]> = {
        manager  : ['processing', 'cooking', 'ready', 'on_delivery', 'delivered', 'completed', 'cancelled'],
        kasir    : ['processing', 'cancelled'],
        kurir    : ['on_delivery', 'delivered'],
        pelanggan: ['completed', 'cancelled'],
      }
      return (allowed[role ?? ''] ?? []).includes(status)
    },

    // Helper: cek apakah user punya salah satu role
    hasRole: (...roles: UserRole[]): boolean => {
      return !!role && roles.includes(role)
    },
  }
}