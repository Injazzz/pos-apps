export interface Menu {
  id: number
  name: string
  price: number
  formatted_price?: string
  category: string
  is_available: boolean
  is_in_stock?: boolean
  stock: number | null
  sort_order: number
  image_path?: string | null // legacy, stored in DB
  image_url?: string | null // from API response
  description?: string | null
  created_at: string
}

export interface MenuCategory {
  name: string
  count: number
}

export interface CreateMenuPayload {
  name: string
  price: number
  category: string
  is_available?: boolean
  description?: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateMenuPayload extends Partial<CreateMenuPayload> {}