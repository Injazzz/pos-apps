import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Auth pages
import LoginPage    from '@/pages/auth/Login'
import RegisterPage from '@/pages/auth/Register'

// Lazy load semua role pages
const ManagerLayout   = lazy(() => import('@/pages/manager/Layout'))
const CashierLayout   = lazy(() => import('@/pages/cashier/Layout'))
const CourierLayout   = lazy(() => import('@/pages/courier/Layout'))
const CustomerLayout  = lazy(() => import('@/pages/customer/Layout'))
const OAuthCallback   = lazy(() => import('@/pages/auth/OAuthCallback'))
const OfflinePage     = lazy(() => import('@/pages/Offline'))

// Shared
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import PageLoader  from '@/components/shared/PageLoader'

export const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────
  { path: '/login',    element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/offline', element: <OfflinePage /> },

  // Google OAuth callback handler
  {
    path: '/auth/callback',
    element: <OAuthCallback />,
  },

  // ── Manager routes ─────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['manager']} />,
    children: [{
      path: '/manager',
      element: (
        <Suspense fallback={<PageLoader />}>
          <ManagerLayout />
        </Suspense>
      ),
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: 'dashboard', lazy: () => import('@/pages/manager/Dashboard') },
        { path: 'users',     lazy: () => import('@/pages/manager/Users') },
        { path: 'menus',     lazy: () => import('@/pages/manager/Menus') },
        { path: 'orders',    lazy: () => import('@/pages/manager/Orders') },
        { path: 'reports',   lazy: () => import('@/pages/manager/Reports') },
        { path: 'logs',      lazy: () => import('@/pages/manager/ActivityLogs') },
      ],
    }],
  },

  // ── Cashier routes ─────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['kasir']} />,
    children: [{
      path: '/cashier',
      element: (
        <Suspense fallback={<PageLoader />}>
          <CashierLayout />
        </Suspense>
      ),
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: 'dashboard', lazy: () => import('@/pages/cashier/Dashboard') },
        { path: 'orders',    lazy: () => import('@/pages/cashier/Orders') },
        { path: 'orders/new',lazy: () => import('@/pages/cashier/NewOrder') },
        { path: 'orders/:id',lazy: () => import('@/pages/cashier/OrderDetail') },
      ],
    }],
  },

  // ── Courier routes ─────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['kurir']} />,
    children: [{
      path: '/courier',
      element: (
        <Suspense fallback={<PageLoader />}>
          <CourierLayout />
        </Suspense>
      ),
      children: [
        { index: true, element: <Navigate to="deliveries" replace /> },
        { path: 'deliveries',    lazy: () => import('@/pages/courier/Deliveries') },
        { path: 'deliveries/:id',lazy: () => import('@/pages/courier/DeliveryDetail') },
      ],
    }],
  },

  // ── Customer routes ────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['pelanggan']} />,
    children: [{
      path: '/customer',
      element: (
        <Suspense fallback={<PageLoader />}>
          <CustomerLayout />
        </Suspense>
      ),
      children: [
        { index: true, element: <Navigate to="menu" replace /> },
        { path: 'menu',      lazy: () => import('@/pages/customer/Menu') },
        { path: 'cart',      lazy: () => import('@/pages/customer/Cart') },
        { path: 'orders',    lazy: () => import('@/pages/customer/Orders') },
        { path: 'orders/:id',lazy: () => import('@/pages/customer/OrderDetail') },
        { path: 'profile',   lazy: () => import('@/pages/customer/Profile') },
      ],
    }],
  },

  // ── Default redirect ───────────────────────────────────────
  { path: '/',  element: <Navigate to="/login" replace /> },
  { path: '*',  element: <Navigate to="/login" replace /> },
])