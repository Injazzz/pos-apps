import type { User, Customer } from './user'
import type { Menu } from './menu'
import type { Payment } from './payment'
import type { Delivery } from './delivery'

export type OrderType     = 'dine_in' | 'take_away' | 'delivery'
export type OrderStatus   =
  | 'pending'
  | 'processing'
  | 'cooking'
  | 'ready'
  | 'on_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export interface Order {
  id: number
  order_code: string
  customer_id: number | null
  cashier_id: number | null
  order_type: OrderType
  total_price: number
  status: OrderStatus
  created_at: string
  updated_at: string
  customer?: Customer
  cashier?: User
  items?: OrderItem[]
  payment?: Payment
  delivery?: Delivery
  status_logs?: OrderStatusLog[]
}

export interface OrderItem {
  id: number
  order_id: number
  menu_id: number
  qty: number
  price: number
  note: string | null
  menu?: Menu
}

export interface OrderStatusLog {
  id: number
  order_id: number
  status: OrderStatus
  updated_by: number
  updated_at: string
  updater?: User
}

// Cart (frontend only, stored in Zustand + localStorage)
export interface CartItem {
  menu_id: number
  menu: Menu
  qty: number
  note: string
}

export interface Cart {
  items: CartItem[]
  total: number
}

// Payloads
export interface CreateOrderPayload {
  order_type: OrderType
  items: {
    menu_id: number
    qty: number
    note?: string
  }[]
  customer_id?: number
  delivery_address?: string
  notes?: string
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus
  reason?: string
}