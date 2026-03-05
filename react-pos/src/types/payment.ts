export type PaymentMethod =
  | 'cash'
  | 'transfer_bank'
  | 'qris'
  | 'down_payment'
  | 'midtrans'

export type PaymentStatus =
  | 'pending'
  | 'partial'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'expired'

export interface Payment {
  id: number
  order_id: number
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  dp_amount?: number | null
  remaining_amount?: number | null
  midtrans_token?: string | null
  midtrans_url?: string | null
  paid_at: string | null
  created_at: string
}

export interface CreatePaymentPayload {
  method: PaymentMethod
  amount: number
  dp_amount?: number
}

export interface MidtransSnapResponse {
  token: string
  redirect_url: string
}