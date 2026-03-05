import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { getApiError } from '@/api/client'
import { disconnectEcho } from '@/lib/echo'
import type { LoginPayload, RegisterPayload, UpdateProfilePayload } from '@/types'

// ─── Query Keys ──────────────────────────────────────────────
export const authKeys = {
  me: ['auth', 'me'] as const,
}

// ─── useLogin ────────────────────────────────────────────────
export function useLogin() {
  const { setAuth }   = useAuthStore()
  const queryClient   = useQueryClient()
  const navigate      = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),

    onSuccess: ({ data }) => {
      const { user, token } = data.data

      // Simpan ke store (persisted ke localStorage)
      setAuth(user, token)

      // Set cache me query
      queryClient.setQueryData(authKeys.me, user)

      toast.success(`Selamat datang, ${user.name}!`)

      // Redirect berdasarkan role
      const routes: Record<string, string> = {
        manager  : '/manager/dashboard',
        kasir    : '/cashier/dashboard',
        kurir    : '/courier/dashboard',
        pelanggan: '/customer/menu',
      }
      navigate(routes[user.role] ?? '/', { replace: true })
    },

    onError: (error) => {
      toast.error(getApiError(error))
    },
  })
}

// ─── useRegister ─────────────────────────────────────────────
export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),

    onSuccess: ({ data }) => {
      const { user, token } = data.data
      setAuth(user, token)
      toast.success('Registrasi berhasil! Selamat datang.')
      navigate('/customer/menu', { replace: true })
    },

    onError: (error) => {
      toast.error(getApiError(error))
    },
  })
}

// ─── useLogout ───────────────────────────────────────────────
export function useLogout() {
  const { logout }    = useAuthStore()
  const queryClient   = useQueryClient()
  const navigate      = useNavigate()

  return useMutation({
    mutationFn: () => authApi.logout(),

    onSettled: () => {
      // Selalu logout di frontend meski API error
      logout()
      queryClient.clear()
      disconnectEcho()
      navigate('/login', { replace: true })
      toast.success('Anda telah logout.')
    },
  })
}

// ─── useMe ───────────────────────────────────────────────────
export function useMe() {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const { data } = await authApi.me()
      return data.data
    },
    enabled: isAuthenticated && !!token,
    staleTime: 1000 * 60 * 5, // 5 menit
  })
}

// ─── useUpdateProfile ────────────────────────────────────────
export function useUpdateProfile() {
  const { updateUser } = useAuthStore()
  const queryClient    = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      authApi.updateProfile(payload),

    onSuccess: ({ data }) => {
      updateUser(data.data)
      queryClient.setQueryData(authKeys.me, data.data)
      toast.success('Profil berhasil diperbarui.')
    },

    onError: (error) => {
      toast.error(getApiError(error))
    },
  })
}