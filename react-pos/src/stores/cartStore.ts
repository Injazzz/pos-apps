/* eslint-disable @typescript-eslint/no-explicit-any */
import { create }                    from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { cartBackupDB }              from '@/lib/db'
import type { CartItem, Menu }       from '@/types'

interface CartState {
  items     : CartItem[]
  total     : number
  totalItems: number
  addItem   : (menu: Menu, qty?: number, note?: string) => void
  removeItem: (menuId: number) => void
  updateQty : (menuId: number, qty: number) => void
  updateNote: (menuId: number, note: string) => void
  clearCart : () => void
  syncToIndexedDB: () => Promise<void>
  restoreFromIndexedDB: () => Promise<void>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      get total() {
        return get().items.reduce(
          (sum, item) => sum + item.menu.price * item.qty,
          0
        )
      },

      get totalItems() {
        return get().items.reduce((sum, item) => sum + item.qty, 0)
      },

      addItem: (menu, qty = 1, note = '') => {
        set((state) => {
          const existing = state.items.find(i => i.menu_id === menu.id)
          const newItems = existing
            ? state.items.map(i =>
                i.menu_id === menu.id
                  ? { ...i, qty: i.qty + qty }
                  : i
              )
            : [...state.items, { menu_id: menu.id, menu, qty, note }]

          // Async backup ke IndexedDB
          cartBackupDB.save(newItems as any).catch(console.error)
          return { items: newItems }
        })
      },

      removeItem: (menuId) => {
        set((state) => {
          const newItems = state.items.filter(i => i.menu_id !== menuId)
          cartBackupDB.save(newItems as any).catch(console.error)
          return { items: newItems }
        })
      },

      updateQty: (menuId, qty) => {
        if (qty <= 0) {
          get().removeItem(menuId)
          return
        }
        set((state) => {
          const newItems = state.items.map(i =>
            i.menu_id === menuId ? { ...i, qty } : i
          )
          cartBackupDB.save(newItems as any).catch(console.error)
          return { items: newItems }
        })
      },

      updateNote: (menuId, note) => {
        set((state) => ({
          items: state.items.map(i =>
            i.menu_id === menuId ? { ...i, note } : i
          ),
        }))
      },

      clearCart: () => {
        cartBackupDB.clear().catch(console.error)
        set({ items: [] })
      },

      // Backup manual ke IndexedDB
      syncToIndexedDB: async () => {
        const { items } = get()
        await cartBackupDB.save(items as any)
      },

      // Restore dari IndexedDB (saat app pertama buka)
      restoreFromIndexedDB: async () => {
        const { items } = get()
        if (items.length === 0) {
          // Coba restore dari IndexedDB
          const backup = await cartBackupDB.getAll()
          if (backup.length > 0) {
            set({ items: backup as unknown as CartItem[] })
          }
        }
      },
    }),
    {
      name   : 'pos-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)