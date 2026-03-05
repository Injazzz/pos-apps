import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (user: AuthUser, token: string) => void
  logout: () => void
  updateUser: (user: Partial<AuthUser>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),
    }),
    {
      name: 'pos-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Hanya persist field ini saja
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)