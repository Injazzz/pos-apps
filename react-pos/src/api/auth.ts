import { apiClient, type ApiResponse } from './client'
import type { AuthUser, LoginPayload, RegisterPayload } from '@/types'

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<{ user: AuthUser; token: string }>>(
      '/auth/login',
      payload
    ),

  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<{ user: AuthUser; token: string }>>(
      '/auth/register',
      payload
    ),

  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout'),

  me: () =>
    apiClient.get<ApiResponse<AuthUser>>('/auth/me'),

  googleLogin: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`
  },
}