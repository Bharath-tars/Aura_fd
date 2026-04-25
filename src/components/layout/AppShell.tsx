import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { useUIStore } from '@/store/uiStore'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} />

      {/* Main content */}
      <div
        className="transition-all duration-200"
        style={{ marginLeft: sidebarOpen ? '240px' : '0' }}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4 text-muted-foreground" />
          </button>
        </header>

        <main className="px-6 py-6 max-w-5xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
