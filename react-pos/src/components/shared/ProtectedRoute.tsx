import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  // Belum login → redirect ke login
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  // Role tidak diizinkan → redirect ke dashboard role masing-masing
  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    const dashboards: Record<string, string> = {
      manager  : '/manager/dashboard',
      kasir    : '/cashier/dashboard',
      kurir    : '/courier/dashboard',
      pelanggan: '/customer/menu',
    }
    return <Navigate to={dashboards[user.role] ?? '/'} replace />
  }

  return <Outlet />
}