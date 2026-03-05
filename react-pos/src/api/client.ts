import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ─── Main API Client ──────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

// ─── Request Interceptor ─────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Attach Bearer token dari Zustand store
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean
    }

    // 401 - Token expired atau invalid, force logout
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // 503 - Offline / Server down, handle gracefully
    if (!error.response) {
      console.warn('[API] Network error - possibly offline')
    }

    return Promise.reject(error)
  }
)

// ─── API Response Type ───────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: {
    current_page: number
    data: T[]
    first_page_url: string
    from: number
    last_page: number
    last_page_url: string
    per_page: number
    to: number
    total: number
  }
}

// ─── Helper: handle API errors consistently ──────────────────────
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Validation errors
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors as Record<string, string[]>
      if (errors) {
        return Object.values(errors).flat().join(', ')
      }
    }
    return (
      error.response?.data?.message ??
      error.message ??
      'Terjadi kesalahan. Coba lagi.'
    )
  }
  return 'Terjadi kesalahan yang tidak diketahui.'
}