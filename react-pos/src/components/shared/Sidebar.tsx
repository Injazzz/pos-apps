import { NavLink } from 'react-router-dom'
import { cn }                   from '@/lib/utils'
import { useAuthStore }         from '@/stores/authStore'
import { ScrollArea }           from '@/components/ui/scroll-area'
import { Badge }                from '@/components/ui/badge'
import { UtensilsCrossed }      from 'lucide-react'
import type { LucideIcon }      from 'lucide-react'

export interface NavItem {
  label    : string
  href     : string
  icon     : LucideIcon
  badge?   : number | string
  exact?   : boolean
}

interface SidebarProps {
  items    : NavItem[]
  onClose? : () => void
}

export default function Sidebar({ items, onClose }: SidebarProps) {
  const { user } = useAuthStore()

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-slate-100">

      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
          <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate">
            POS Delivery
          </p>
          <p className="text-xs text-slate-400 capitalize">
            {user?.role}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-2">
          {items.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              onClose={onClose}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* User info bottom */}
      <div className="border-t border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function SidebarItem({ item, onClose }: { item: NavItem; onClose?: () => void }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.href}
      end={item.exact}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
          isActive
            ? 'bg-primary text-primary-foreground font-medium'
            : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && (
        <Badge
          variant="secondary"
          className="h-5 min-w-5 px-1.5 text-[10px] font-bold"
        >
          {item.badge}
        </Badge>
      )}
    </NavLink>
  )
}