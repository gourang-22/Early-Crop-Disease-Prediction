import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Shell
import AppShell from './components/AppShell'
import PageLoader from './components/PageLoader'

// Auth pages (no shell)
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'

// Farmer pages (with shell)
import DashboardPage from './pages/DashboardPage'
import FarmsPage from './pages/FarmsPage'
import CropHealthPage from './pages/CropHealthPage'
import DiseaseScanPage from './pages/DiseaseScanPage'
import DiagnosisResultPage from './pages/DiagnosisResultPage'
import AlertsPage from './pages/AlertsPage'
import AssistantPage from './pages/AssistantPage'
import HistoryPage from './pages/HistoryPage'

// Officer pages (with shell)
import OfficerDashboard from './pages/OfficerDashboard'

/** Requires the user to be logged in; redirects to /login otherwise */
function ProtectedRoute({ children, officerOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (officerOnly && !user.is_officer) return <Navigate to="/dashboard" replace />
  return children
}

/** Wraps a page in the AppShell */
function ShellRoute({ children, officerOnly = false }) {
  return (
    <ProtectedRoute officerOnly={officerOnly}>
      <AppShell>
        <PageLoader>
          {children}
        </PageLoader>
      </AppShell>
    </ProtectedRoute>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-earth-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-forest-700 flex items-center justify-center text-3xl shadow-lg">🌱</div>
          <p className="text-charcoal-400 text-sm font-medium">Loading KrishiScan...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public auth routes */}
      <Route
        path="/login"
        element={user ? <Navigate to={user.is_officer ? '/officer' : '/dashboard'} replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Farmer routes */}
      <Route path="/dashboard" element={<ShellRoute><DashboardPage /></ShellRoute>} />
      <Route path="/farms" element={<ShellRoute><FarmsPage /></ShellRoute>} />
      <Route path="/health" element={<ShellRoute><CropHealthPage /></ShellRoute>} />
      <Route path="/disease" element={<ShellRoute><DiseaseScanPage /></ShellRoute>} />
      <Route path="/disease/result" element={<ShellRoute><DiagnosisResultPage /></ShellRoute>} />
      <Route path="/alerts" element={<ShellRoute><AlertsPage /></ShellRoute>} />
      <Route path="/assistant" element={<ShellRoute><AssistantPage /></ShellRoute>} />
      <Route path="/history" element={<ShellRoute><HistoryPage /></ShellRoute>} />

      {/* Officer route */}
      <Route path="/officer" element={<ShellRoute officerOnly={false}><OfficerDashboard /></ShellRoute>} />

      {/* Legacy redirects */}
      <Route path="/chat" element={<Navigate to="/assistant" replace />} />
      <Route path="/scan" element={<Navigate to="/disease" replace />} />
      <Route path="/weather" element={<Navigate to="/health" replace />} />

      {/* Default redirects */}
      <Route
        path="/"
        element={
          user
            ? <Navigate to={user.is_officer ? '/officer' : '/dashboard'} replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App