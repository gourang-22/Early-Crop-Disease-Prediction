import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../services/api'

const FILTERS = ['All', 'Suspected', 'Confirmed', 'Rejected']

function timeAgo(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0)  return `${days} day${days > 1 ? 's' : ''} ago`
  if (hrs > 0)   return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  if (mins > 0)  return `${mins} min${mins > 1 ? 's' : ''} ago`
  return 'Just now'
}

export default function HistoryPage() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    fetch(`${API}/cases/`)
      .then(r => r.json())
      .then(data => setCases(Array.isArray(data) ? data : []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All' ? cases : cases.filter(c => c.status === filter)
  const counts = {
    All: cases.length,
    Suspected: cases.filter(c => c.status === 'Suspected').length,
    Confirmed: cases.filter(c => c.status === 'Confirmed').length,
    Rejected:  cases.filter(c => c.status === 'Rejected').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800">Case History</h1>
          <p className="text-charcoal-400 text-sm mt-0.5">All submitted disease scans and their verification status</p>
        </div>
        {cases.length > 0 && (
          <span className="text-xs text-charcoal-500 bg-earth-100 px-3 py-1.5 rounded-full font-semibold">
            {cases.length} total case{cases.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      {cases.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition ${
                filter === f
                  ? 'bg-forest-700 text-white border-forest-700 shadow-sm'
                  : 'bg-white text-charcoal-500 border-earth-200 hover:border-forest-300'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3">📋</div>
          <h3 className="font-bold text-charcoal-700 mb-2">
            {filter !== 'All' ? `No ${filter.toLowerCase()} cases` : 'No cases yet'}
          </h3>
          <p className="text-charcoal-400 text-sm mb-6">
            {filter !== 'All' ? 'Try a different filter.' : 'Submit a disease scan to see it here.'}
          </p>
          {filter === 'All' && <Link to="/disease" className="btn-primary">Scan a Crop</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const conf = Math.round(c.confidence * 100)
            const statusCls = `status-${c.status.toLowerCase()}`
            const riskColor = c.risk_level === 'HIGH' ? 'text-red-600' : c.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
            const riskBg = c.risk_level === 'HIGH' ? 'bg-red-100' : c.risk_level === 'MEDIUM' ? 'bg-yellow-100' : 'bg-green-100'
            const ago = timeAgo(c.created_at)
            return (
              <div key={c.id} className="card card-hover p-5 flex items-center gap-4 transition">
                <div className={`w-12 h-12 rounded-xl ${riskBg} flex items-center justify-center text-2xl flex-shrink-0`}>
                  🌿
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-charcoal-800 text-sm truncate">{c.disease}</p>
                    <span className={statusCls}>{c.status}</span>
                  </div>
                  <p className="text-xs text-charcoal-500">
                    {c.crop} · {c.village}
                    {ago && <span className="text-charcoal-400"> · {ago}</span>}
                  </p>
                  <span className={`text-xs font-bold ${riskColor}`}>{c.risk_level} RISK</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-charcoal-700">{conf}%</p>
                  <p className="text-[10px] text-charcoal-400 uppercase tracking-wide">AI Conf.</p>
                  <p className="text-[10px] font-mono text-charcoal-300">#{c.id}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}