import { apiClient, type ApiResponse, type PaginatedResponse } from './client'
import type { Menu, CreateMenuPayload, UpdateMenuPayload } from '@/types'

export const menusApi = {
  // Public
  getAll: (params?: { category?: string; search?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<Menu>>('/menus', { params }),

  getOne: (id: number) =>
    apiClient.get<ApiResponse<Menu>>(`/menus/${id}`),

  // Manager only
  create: (payload: CreateMenuPayload) =>
    apiClient.post<ApiResponse<Menu>>('/manager/menus', payload),

  update: (id: number, payload: UpdateMenuPayload) =>
    apiClient.put<ApiResponse<Menu>>(`/manager/menus/${id}`, payload),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<null>>(`/manager/menus/${id}`),

  toggleAvailability: (id: number) =>
    apiClient.patch<ApiResponse<Menu>>(
      `/manager/menus/${id}/toggle-availability`
    ),
}