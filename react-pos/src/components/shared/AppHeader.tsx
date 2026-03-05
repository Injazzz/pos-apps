import { LogOut, Menu } from 'lucide-react'
import { useLogout }          from '@/hooks/useAuth'
import { useAuthStore }       from '@/stores/authStore'
import { Button }             from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import NotificationBell from './NotificationBell'
import OfflineBanner    from './OfflineBanner'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

interface Props {
  onMenuClick?: () => void
  title?      : string
}

export default function AppHeader({ onMenuClick, title }: Props) {
  const { user }    = useAuthStore()
  const logout      = useLogout()
  const { isOnline }= useOnlineStatus()

  return (
    <>
      <OfflineBanner />
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4">

        {/* Menu button (mobile) */}
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Title */}
        {title && (
          <h1 className="font-semibold text-sm hidden sm:block">{title}</h1>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Online indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className="text-xs text-muted-foreground hidden sm:block">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                  🎭 {user?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => logout.mutate()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </>
  )
}
