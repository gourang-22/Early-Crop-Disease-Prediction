import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWeather } from '../context/WeatherContext'
import { API } from '../services/api'

function StatCard({ label, value, sub, color = 'forest' }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
      {sub && <p className="text-xs text-charcoal-400 mt-1">{sub}</p>}
    </div>
  )
}

function RiskMeter({ risk, loading }) {
  const pct = risk ?? 0
  const cls = pct >= 70 ? 'risk-high' : pct >= 40 ? 'risk-medium' : 'risk-low'
  const label = pct >= 70 ? 'HIGH' : pct >= 40 ? 'MEDIUM' : 'LOW'
  const textColor = pct >= 70 ? 'text-red-700' : pct >= 40 ? 'text-yellow-700' : 'text-green-700'
  const bgColor = pct >= 70 ? 'bg-red-50 border-red-200' : pct >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'

  if (loading) return <div className="skeleton card p-5 h-[110px]" />

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
      <p className="text-xs text-charcoal-400 mt-2">Based on live weather data</p>
    </div>
  )
}

function WeatherCard({ label, value, icon, loading }) {
  if (loading) return <div className="skeleton card p-5 h-[100px]" />
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wide mb-2">{icon} {label}</p>
      <p className="text-2xl font-bold text-charcoal-700">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user, activeFarm, farms } = useAuth()
  const { weatherData, weatherLoading, weatherError, fetchWeather } = useWeather()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [atFarmLocation, setAtFarmLocation] = useState(false)
  const [gpsDetecting, setGpsDetecting] = useState(false)

  // Fetch weather based on At Farm toggle or active farm / user location
  useEffect(() => {
    if (atFarmLocation) {
      if (navigator.geolocation) {
        setGpsDetecting(true)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGpsDetecting(false)
            fetchWeather(
              pos.coords.latitude,
              pos.coords.longitude,
              'Current GPS Location',
              activeFarm?.crop || 'Tomato',
              activeFarm?.growth_stage || 'Vegetative'
            )
          },
          () => {
            setGpsDetecting(false)
            const targetCity = activeFarm
              ? `${activeFarm.village ? activeFarm.village + ', ' : ''}${activeFarm.district}, ${activeFarm.state}`
              : (user?.location || 'Nashik, Maharashtra')
            fetchWeather(
              activeFarm?.latitude || null,
              activeFarm?.longitude || null,
              targetCity,
              activeFarm?.crop || 'Tomato',
              activeFarm?.growth_stage || 'Vegetative'
            )
          }
        )
      }
    } else {
      const targetCity = activeFarm
        ? `${activeFarm.village ? activeFarm.village + ', ' : ''}${activeFarm.district}, ${activeFarm.state}`
        : (user?.location || 'Nashik, Maharashtra')
      fetchWeather(
        activeFarm?.latitude || null,
        activeFarm?.longitude || null,
        targetCity,
        activeFarm?.crop || 'Tomato',
        activeFarm?.growth_stage || 'Vegetative'
      )
    }
  }, [activeFarm, atFarmLocation, user, fetchWeather])

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-charcoal-400 text-sm mt-1">
            {activeFarm ? `Monitoring ${activeFarm.name} · ${activeFarm.crop} · ${activeFarm.growth_stage}` : (user?.location ? `Location: ${user.location}` : 'No farm selected')}
          </p>
        </div>

        {/* At Farm Location Toggle Switch */}
        <div className="bg-white border border-earth-200 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-4 min-w-[280px]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{atFarmLocation ? '📍' : '🏡'}</span>
            <div>
              <p className="text-xs font-bold text-charcoal-800 leading-snug">
                {atFarmLocation ? 'At Farm (Live GPS)' : 'Stationary Farm Location'}
              </p>
              <p className="text-[10px] text-charcoal-400 leading-none mt-0.5">
                {atFarmLocation
                  ? (gpsDetecting ? 'Detecting GPS...' : 'Fetching live location')
                  : (activeFarm ? `${activeFarm.district}, ${activeFarm.state}` : (user?.location || 'Nashik, Maharashtra'))}
              </p>
            </div>
          </div>

          {/* Switch slider */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={atFarmLocation}
              onChange={(e) => setAtFarmLocation(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-earth-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-earth-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-600"></div>
          </label>
        </div>
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
                <Link to="/disease" className="inline-flex items-center gap-2 bg-white text-red-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition">
                  📷 Inspect & Scan
                </Link>
                <Link to="/assistant" className="inline-flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-800 transition">
                  💬 Ask AI
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RiskMeter risk={weatherData?.overall_risk} loading={weatherLoading} />
        <WeatherCard
          label="Temperature"
          value={weatherData ? `${weatherData.current_temp}°C` : '—'}
          icon="🌡️"
          loading={weatherLoading}
        />
        <WeatherCard
          label="Humidity"
          value={weatherData ? `${weatherData.current_humidity}%` : '—'}
          icon="💧"
          loading={weatherLoading}
        />
        <StatCard
          label="Unread Alerts"
          value={unreadCount}
          sub="Click to view all"
          color={unreadCount > 0 ? 'red' : 'forest'}
        />
      </div>

      {/* Weather summary banner */}
      {weatherData && (
        <div className={`rounded-2xl p-4 border text-sm font-medium animate-fade-in ${
          weatherData.overall_risk_level === 'HIGH' ? 'bg-red-50 border-red-200 text-red-800'
          : weatherData.overall_risk_level === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          {weatherData.summary}
          <Link to="/health" className="ml-3 underline font-semibold">View 6-day forecast →</Link>
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
            { to: '/health', icon: '📊', title: 'Crop Health Report', desc: 'View 6-day risk trend and live weather data', color: 'bg-forest-50 border-forest-200 hover:border-forest-400' },
            { to: '/assistant', icon: '🤖', title: 'AI Assistant', desc: 'Ask KrishiBot for crop management guidance', color: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
          ].map(a => (
            <Link key={a.to} to={a.to} className={`card card-hover border p-5 ${a.color} transition`}>
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
