import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_FARMER = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/farms', icon: '🌾', label: 'My Farms' },
  { to: '/health', icon: '📊', label: 'Crop Health' },
  { to: '/disease', icon: '🔬', label: 'Disease Scanner' },
  { to: '/alerts', icon: '🔔', label: 'Alerts' },
  { to: '/assistant', icon: '🤖', label: 'AI Assistant' },
  { to: '/history', icon: '📋', label: 'Case History' },
]

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
      <div className="w-9 h-9 rounded-xl bg-forest-500 flex items-center justify-center text-xl shadow-lg">
        🌱
      </div>
      <div>
        <p className="text-white font-bold text-sm tracking-wide leading-none">KrishiScan</p>
        <p className="text-white/40 text-[10px] mt-0.5 leading-none">Crop Intelligence</p>
      </div>
    </div>
  )
}

function SidebarNav({ links }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {links.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <span className="icon">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function UserFooter({ user, logout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="border-t border-white/5 p-3">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/90 text-xs font-semibold truncate">{user?.name}</p>
          <p className="text-white/40 text-[10px] truncate">{user?.phone}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-white/30 hover:text-white/70 transition text-xs flex-shrink-0"
          title="Sign out"
        >
          ⎋
        </button>
      </div>
    </div>
  )
}

export default function AppShell({ children }) {
  const { user, farms, activeFarm, selectFarm, logout } = useAuth()

  const isOfficer = user?.is_officer

  return (
    <div className="flex min-h-screen bg-earth-50">
      {/* Sidebar */}
      <aside className="sidebar">
        <SidebarLogo />

        {!isOfficer && (
          <SidebarNav links={NAV_FARMER} />
        )}

        {isOfficer && (
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            <NavLink to="/officer" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">🗺️</span>
              Officer Dashboard
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">⊞</span>
              Farmer View
            </NavLink>
          </nav>
        )}

        <UserFooter user={user} logout={logout} />
      </aside>

      {/* Main content */}
      <div className="page-content flex-1">
        {/* Topbar */}
        <header className="topbar sticky top-0 z-30">
          {/* Farm selector */}
          {!isOfficer && farms.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-charcoal-400 hidden sm:block">Active farm:</span>
              <select
                value={activeFarm?.id || ''}
                onChange={e => {
                  const farm = farms.find(f => f.id === parseInt(e.target.value))
                  if (farm) selectFarm(farm)
                }}
                className="text-sm font-semibold text-charcoal-800 bg-earth-50 border border-earth-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-forest-400 cursor-pointer"
              >
                {farms.map(f => (
                  <option key={f.id} value={f.id}>🌾 {f.name} — {f.crop}</option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            {/* Status indicator */}
            <span className="flex items-center gap-1.5 text-xs text-forest-600 bg-forest-50 border border-forest-100 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-pulse"></span>
              Online
            </span>

            {/* Officer badge */}
            {isOfficer && (
              <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-semibold">
                👮 Officer Portal
              </span>
            )}

            {/* User avatar */}
            <div className="w-8 h-8 rounded-full bg-forest-700 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="page-body animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
