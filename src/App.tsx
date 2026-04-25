import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppShell from '@/components/layout/AppShell'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Setup from '@/pages/Setup'
import Dashboard from '@/pages/Dashboard'
import Coach from '@/pages/Coach'
import MoodTracker from '@/pages/MoodTracker'
import Journal from '@/pages/Journal'
import JournalEditor from '@/pages/JournalEditor'
import WellnessPlans from '@/pages/WellnessPlans'
import PlanDetail from '@/pages/PlanDetail'
import Analytics from '@/pages/Analytics'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<Setup />} />

        {/* Authenticated app routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/coach" element={<Coach />} />
                  <Route path="/coach/:sessionId" element={<Coach />} />
                  <Route path="/mood" element={<MoodTracker />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/journal/new" element={<JournalEditor />} />
                  <Route path="/journal/:id" element={<JournalEditor />} />
                  <Route path="/wellness" element={<WellnessPlans />} />
                  <Route path="/wellness/:planId" element={<PlanDetail />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
