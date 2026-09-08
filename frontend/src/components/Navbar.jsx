import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

const links = [
  { to: '/disease', label: '🌿 Crop Disease Scan' },
  { to: '/scan',    label: '🪨 Soil Scan' },
  { to: '/insect',  label: '🐛 Insect Scan' },
  { to: '/weather', label: '🌦️ Weather' },
  { to: '/officer', label: '👮 Officer Dashboard' },
]

  return (
    <nav className="bg-forest-800 border-b border-forest-700 px-6 py-3 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="text-white font-bold text-lg tracking-tight">KrishiScan</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                pathname === to
                  ? 'bg-forest-600 text-white'
                  : 'text-forest-200 hover:text-white hover:bg-forest-700'
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/chat"
            className={`ml-2 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              pathname === '/chat'
                ? 'bg-earth-500 text-white'
                : 'bg-earth-600 text-white hover:bg-earth-500'
            }`}
          >
            💬 Farm Assistant
          </Link>
        </div>
      </div>
    </nav>
  )
}