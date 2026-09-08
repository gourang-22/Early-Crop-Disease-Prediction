import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:8000'

function StatCard({ label, value, sub, color = 'forest' }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
      {sub && <p className="text-xs text-charcoal-400 mt-1">{sub}</p>}
    </div>
  )
}

function RiskMeter({ risk }) {
  const pct = risk
  const cls = pct >= 70 ? 'risk-high' : pct >= 40 ? 'risk-medium' : 'risk-low'
  const label = pct >= 70 ? 'HIGH' : pct >= 40 ? 'MEDIUM' : 'LOW'
  const textColor = pct >= 70 ? 'text-red-700' : pct >= 40 ? 'text-yellow-700' : 'text-green-700'
  const bgColor = pct >= 70 ? 'bg-red-50 border-red-200' : pct >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'

  return (
    <div className={`card p-5 border ${bgColor}`}>
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wide">Disease Risk</p>
        <span className={`text-sm font-bold ${textColor}`}>{label}</span>
      </div>
      <p className={`text-3xl font-bold mb-3 ${textColor}`}>{pct}%</p>
      <div className="risk-bar-wrap">
        <div className={`risk-bar ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-charcoal-400 mt-2">Based on weather & crop stage</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user, activeFarm, farms } = useAuth()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)

  useEffect(() => {
    if (!activeFarm?.id) return
    setAlertsLoading(true)
    fetch(`${API}/alerts/?farm_id=${activeFarm.id}`)
      .then(r => r.json())
      .then(data => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]))
      .finally(() => setAlertsLoading(false))
  }, [activeFarm])

  const highAlert = alerts.find(a => a.severity === 'HIGH' && !a.is_read)
  const unreadCount = alerts.filter(a => !a.is_read).length

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-charcoal-400 text-sm mt-1">
            {activeFarm ? `Monitoring ${activeFarm.name} · ${activeFarm.crop} · ${activeFarm.growth_stage}` : 'No farm selected'}
          </p>
        </div>
        <Link to="/farms" className="btn-secondary text-sm">
          + Add Farm
        </Link>
      </div>

      {/* HIGH alert banner */}
      {highAlert && (
        <div className="bg-red-600 rounded-2xl p-5 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10 flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base mb-1">{highAlert.title}</p>
              <p className="text-red-100 text-sm leading-relaxed">{highAlert.message}</p>
              <div className="flex gap-3 mt-4">
                <Link
                  to="/disease"
                  className="inline-flex items-center gap-2 bg-white text-red-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition"
                >
                  📷 Inspect & Scan
                </Link>
                <Link
                  to="/assistant"
                  className="inline-flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-800 transition"
                >
                  💬 Ask AI
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      {activeFarm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RiskMeter risk={82} />
          <StatCard label="Current Temp" value="24°C" sub="High Humidity 88%" color="charcoal" />
          <StatCard label="Growth Stage" value={activeFarm.growth_stage} sub={`Since ${activeFarm.sowing_date || 'N/A'}`} color="forest" />
          <StatCard label="Unread Alerts" value={unreadCount} sub="Click to view all" color={unreadCount > 0 ? 'red' : 'forest'} />
        </div>
      )}

      {/* Farm info card */}
      {activeFarm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-charcoal-800 text-base">Active Farm</h2>
            <Link to="/farms" className="text-xs text-forest-600 hover:text-forest-500 font-semibold">View All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { label: 'FARM NAME', val: activeFarm.name },
              { label: 'CROP', val: `${activeFarm.crop}${activeFarm.crop_variety ? ` (${activeFarm.crop_variety})` : ''}` },
              { label: 'LOCATION', val: `${activeFarm.village || '—'}, ${activeFarm.district}` },
              { label: 'AREA', val: activeFarm.area || '—' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] font-bold text-charcoal-400 tracking-widest uppercase mb-1">{item.label}</p>
                <p className="font-semibold text-charcoal-800 text-sm">{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-bold text-charcoal-700 text-sm uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: '/disease', icon: '🔬', title: 'Disease Scanner', desc: 'Upload a photo to detect crop diseases instantly', color: 'bg-red-50 border-red-200 hover:border-red-400' },
            { to: '/health', icon: '📊', title: 'Crop Health Report', desc: 'View detailed risk trends and environmental factors', color: 'bg-forest-50 border-forest-200 hover:border-forest-400' },
            { to: '/assistant', icon: '🤖', title: 'AI Assistant', desc: 'Ask KrishiBot for crop management guidance', color: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
          ].map(a => (
            <Link
              key={a.to}
              to={a.to}
              className={`card card-hover border p-5 ${a.color} transition`}
            >
              <span className="text-3xl mb-3 block">{a.icon}</span>
              <h3 className="font-bold text-charcoal-800 text-sm mb-1">{a.title}</h3>
              <p className="text-xs text-charcoal-400 leading-relaxed">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* No farm state */}
      {farms.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🌾</div>
          <h3 className="text-lg font-bold text-charcoal-700 mb-2">No farms yet</h3>
          <p className="text-charcoal-400 text-sm mb-6">Add your first farm to start monitoring crop health.</p>
          <Link to="/onboarding" className="btn-primary">Add Your First Farm</Link>
        </div>
      )}
    </div>
  )
}
