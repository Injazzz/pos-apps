export type UserRole = 'manager' | 'kasir' | 'kurir' | 'pelanggan'
export type UserStatus = 'active' | 'inactive'

export interface User {
  id: number
  name: string
  avatar: string
  email: string
  role: UserRole
  phone: string | null
  status: UserStatus
  created_at: string
  customer?: Customer
}

export interface Customer {
  id: number
  user_id: number
  address: string | null
  notes: string | null
  user?: User
}

export interface AuthUser extends User {
  token?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  role?: UserRole
}

export interface UpdateProfilePayload {
  name?: string
  phone?: string
  address?: string
  notes?: string
}