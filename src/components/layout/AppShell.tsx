import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useUIStore } from '@/store/uiStore'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { pathname } = useLocation()
  const isChat = /^\/(coach|therapist)/.test(pathname)

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} />

      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-200"
        style={{ marginLeft: sidebarOpen ? '240px' : '0' }}
      >
        {/* Top bar */}
        <header className="shrink-0 z-30 bg-background/80 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4 text-muted-foreground" />
          </button>
        </header>

        {isChat ? (
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-auto">
            <div className="px-6 py-6 max-w-5xl mx-auto">
              {children}
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
