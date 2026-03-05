import { apiClient, type ApiResponse } from './client'
import type { Payment } from '@/types'

export interface CreatePaymentPayload {
  method        : string
  amount        : number
  cash_received?: number
  dp_amount?    : number
  bank_name?    : string
}

export interface SnapTokenResponse {
  payment    : Payment
  snap_token : string
  snap_url   : string
  client_key : string
}

export const paymentsApi = {
  // Kasir: proses payment manual
  processPayment: (orderId: number, payload: CreatePaymentPayload) =>
    apiClient.post<ApiResponse<Payment>>(
      `/cashier/orders/${orderId}/payments`,
      payload
    ),

  // Kasir: lihat payment satu order
  getOrderPayment: (orderId: number) =>
    apiClient.get<ApiResponse<Payment>>(
      `/cashier/orders/${orderId}/payments`
    ),

  // Kasir: konfirmasi transfer
  confirmTransfer: (orderId: number, formData: FormData) =>
    apiClient.post<ApiResponse<Payment>>(
      `/cashier/orders/${orderId}/payments/confirm-transfer`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  // Customer: buat Midtrans Snap token
  createSnapToken: (orderId: number) =>
    apiClient.post<ApiResponse<SnapTokenResponse>>(
      `/customer/orders/${orderId}/payment/snap`
    ),
}