import type { User } from './user'

export type DeliveryStatus =
  | 'waiting'
  | 'assigned'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'failed'

export interface Delivery {
  id: number
  order_id: number
  courier_id: number | null
  address: string
  delivery_status: DeliveryStatus
  proof_photo?: string | null
  delivered_at: string | null
  created_at: string
  courier?: User
}

export interface UpdateDeliveryStatusPayload {
  delivery_status: DeliveryStatus
}

export interface UploadProofPayload {
  photo: File
}