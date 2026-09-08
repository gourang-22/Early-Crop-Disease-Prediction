import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:8000'

function AlertItem({ alert, onMarkRead }) {
  const sev = alert.severity?.toUpperCase()
  const sevStyle = {
    HIGH:   { card: 'border-red-200 bg-red-50',    badge: 'badge-high',   icon: '🔴' },
    MEDIUM: { card: 'border-yellow-200 bg-yellow-50', badge: 'badge-medium', icon: '🟡' },
    LOW:    { card: 'border-green-200 bg-green-50',  badge: 'badge-low',    icon: '🟢' },
  }[sev] || { card: 'border-earth-200 bg-earth-50', badge: 'badge-low', icon: '⚪' }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'just now'
  }

  return (
    <div className={`border rounded-xl p-5 ${sevStyle.card} ${alert.is_read ? 'opacity-60' : ''} animate-fade-in`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-xl flex-shrink-0">{sevStyle.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-charcoal-800 text-sm">{alert.title}</h3>
              <span className={`${sevStyle.badge} text-[10px] font-bold px-1.5 py-0.5 rounded`}>{sev}</span>
              {!alert.is_read && (
                <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" title="Unread" />
              )}
            </div>
            <p className="text-sm text-charcoal-600 leading-relaxed">{alert.message}</p>
            <p className="text-xs text-charcoal-400 mt-2">{timeAgo(alert.date)}</p>
          </div>
        </div>
        {!alert.is_read && (
          <button
            onClick={() => onMarkRead(alert.id)}
            className="text-xs text-charcoal-400 hover:text-charcoal-600 font-medium flex-shrink-0 whitespace-nowrap"
          >
            Mark read
          </button>
        )}
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const { activeFarm } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const fetchAlerts = async () => {
    if (!activeFarm?.id) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/alerts/?farm_id=${activeFarm.id}`)
      const data = await res.json()
      setAlerts(Array.isArray(data) ? data : [])
    } catch {
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAlerts() }, [activeFarm])

  const markRead = async (id) => {
    await fetch(`${API}/alerts/${id}/read`, { method: 'POST' })
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
  }

  const filtered = filter === 'ALL' ? alerts :
    filter === 'UNREAD' ? alerts.filter(a => !a.is_read) :
    alerts.filter(a => a.severity === filter)

  const unreadCount = alerts.filter(a => !a.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800">Alerts</h1>
          <p className="text-charcoal-400 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => alerts.filter(a => !a.is_read).forEach(a => markRead(a.id))}
            className="btn-secondary text-sm"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'UNREAD', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-4 py-1.5 rounded-full border font-semibold transition ${
              filter === f
                ? 'bg-forest-700 text-white border-forest-700'
                : 'bg-white text-charcoal-600 border-earth-200 hover:border-forest-300'
            }`}
          >
            {f}
            {f === 'ALL' && ` (${alerts.length})`}
            {f === 'UNREAD' && ` (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="font-bold text-charcoal-700 text-base mb-1">No alerts</h3>
          <p className="text-charcoal-400 text-sm">
            {filter === 'ALL' ? 'Your farm has no alerts right now.' : `No ${filter.toLowerCase()} alerts.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <AlertItem key={alert.id} alert={alert} onMarkRead={markRead} />
          ))}
        </div>
      )}
    </div>
  )
}
