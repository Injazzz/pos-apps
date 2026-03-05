import { create } from 'zustand'

export interface AppNotification {
  id: string
  type: 'order_new' | 'order_status' | 'payment' | 'delivery' | 'info'
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number

  // Actions
  addNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'created_at'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: crypto.randomUUID(),
      read: false,
      created_at: new Date().toISOString(),
    }
    set((state) => ({
      notifications: [newNotif, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }))
  },

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const notif = state.notifications.find((n) => n.id === id)
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notif && !notif.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }
    }),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))