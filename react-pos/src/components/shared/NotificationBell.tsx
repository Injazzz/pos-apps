import { useState } from 'react'
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

import { Button }  from '@/components/ui/button'
import { Badge }   from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useNotificationStore,
  type AppNotification,
} from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'

// ─── Icon per type ────────────────────────────────────────────
const notifIcons: Record<AppNotification['type'], string> = {
  order_new   : '🛎️',
  order_status: '📦',
  payment     : '💰',
  delivery    : '🚚',
  info        : 'ℹ️',
}

// ─── Main Component ───────────────────────────────────────────
export default function NotificationBell() {
  const [open, setOpen]         = useState(false)
  const navigate                = useNavigate()
  const { user }                = useAuthStore()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore()

  const handleClick = (notif: AppNotification) => {
    markAsRead(notif.id)

    // Navigate berdasarkan type dan role
    if (notif.data?.orderId) {
      const orderId = notif.data.orderId
      const role    = user?.role

      const paths: Record<string, string> = {
        manager  : `/manager/orders/${orderId}`,
        kasir    : `/cashier/orders/${orderId}`,
        kurir    : `/courier/deliveries`,
        pelanggan: `/customer/orders/${orderId}`,
      }

      if (role && paths[role]) {
        navigate(paths[role])
        setOpen(false)
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifikasi</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {unreadCount} baru
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Tandai semua dibaca"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                title="Hapus semua"
                onClick={clearAll}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="h-95">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onClick={() => handleClick(notif)}
                  onRemove={() => removeNotification(notif.id)}
                  onMarkRead={() => markAsRead(notif.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

// ─── Single Notification Item ─────────────────────────────────
function NotificationItem({
  notif,
  onClick,
  onRemove,
  onMarkRead,
}: {
  notif    : AppNotification
  onClick  : () => void
  onRemove : () => void
  onMarkRead: () => void
}) {
  return (
    <div
      className={`
        relative flex gap-3 px-4 py-3 cursor-pointer group
        transition-colors hover:bg-muted/50
        ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}
      `}
      onClick={onClick}
    >
      {/* Unread dot */}
      {!notif.read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-dot" />
      )}

      {/* Icon */}
      <div className="shrink-0 mt-0.5 text-xl leading-none">
        {notifIcons[notif.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${!notif.read ? 'font-semibold' : 'font-medium'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notif.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notif.created_at), {
            addSuffix: true,
            locale   : idLocale,
          })}
        </p>
      </div>

      {/* Actions (show on hover) */}
      <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notif.read && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead() }}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            title="Tandai dibaca"
          >
            <Check className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="p-1 rounded hover:bg-muted text-muted-foreground"
          title="Hapus"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}