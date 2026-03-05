export interface Menu {
  id: number
  name: string
  price: number
  category: string
  is_available: boolean
  stock: number | null
  sort_order: number
  image_path: string | string[] | null 
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