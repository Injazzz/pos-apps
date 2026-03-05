import { apiClient, type ApiResponse, type PaginatedResponse } from './client'
import type {
  Order,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
} from '@/types'

export const ordersApi = {
  // Customer
  customer: {
    getAll: (params?: { status?: string; page?: number }) =>
      apiClient.get<PaginatedResponse<Order>>('/customer/orders', { params }),

    getOne: (id: number) =>
      apiClient.get<ApiResponse<Order>>(`/customer/orders/${id}`),

    create: (payload: CreateOrderPayload) =>
      apiClient.post<ApiResponse<Order>>('/customer/orders', payload),

    markCompleted: (id: number) =>
      apiClient.patch<ApiResponse<Order>>(
        `/customer/orders/${id}/complete`
      ),
  },

  // Cashier
  cashier: {
    getAll: (params?: { status?: string; page?: number }) =>
      apiClient.get<PaginatedResponse<Order>>('/cashier/orders', { params }),

    getOne: (id: number) =>
      apiClient.get<ApiResponse<Order>>(`/cashier/orders/${id}`),

    create: (payload: CreateOrderPayload) =>
      apiClient.post<ApiResponse<Order>>('/cashier/orders', payload),

    updateStatus: (id: number, payload: UpdateOrderStatusPayload) =>
      apiClient.patch<ApiResponse<Order>>(
        `/cashier/orders/${id}/status`,
        payload
      ),
  },

  // Manager
  manager: {
    getAll: (params?: { status?: string; page?: number; date?: string }) =>
      apiClient.get<PaginatedResponse<Order>>('/manager/orders', { params }),

    getOne: (id: number) =>
      apiClient.get<ApiResponse<Order>>(`/manager/orders/${id}`),

    updateStatus: (id: number, payload: UpdateOrderStatusPayload) =>
      apiClient.patch<ApiResponse<Order>>(
        `/manager/orders/${id}/status`,
        payload
      ),

    assignCourier: (id: number, courierId: number) =>
      apiClient.post<ApiResponse<Order>>(
        `/manager/orders/${id}/assign-courier`,
        { courier_id: courierId }
      ),
  },
}