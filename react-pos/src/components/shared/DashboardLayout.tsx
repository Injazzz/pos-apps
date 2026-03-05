import { useState }        from 'react'
import { Outlet }          from 'react-router-dom'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import Sidebar, { type NavItem } from './Sidebar'
import AppHeader           from './AppHeader'
import PWAInstallBanner    from './PWAInstallBanner'
import OfflineSyncStatus   from './OfflineSyncStatus'
import type { ReactNode }  from 'react'

interface DashboardLayoutProps {
  navItems : NavItem[]
  title?   : string
  children?: ReactNode
}

export default function DashboardLayout({
  navItems,
  title,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar items={navItems} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar
            items={navItems}
            onClose={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* PWA Components */}
      <PWAInstallBanner />
      <OfflineSyncStatus />
    </div>
  )
}