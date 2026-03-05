import type { ReactNode } from 'react'
import type { UserRole } from '@/types'
import { usePermissions } from '@/hooks/usePermissions'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Render children hanya jika user punya role yang diizinkan.
 * Gunakan untuk hide/show elemen UI berdasarkan role.
 *
 * @example
 * <RoleGuard allowedRoles={['manager']}>
 *   <DeleteButton />
 * </RoleGuard>
 */
export default function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { hasRole } = usePermissions()

  if (!hasRole(...allowedRoles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}