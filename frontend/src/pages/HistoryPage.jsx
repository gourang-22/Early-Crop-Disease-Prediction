import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API = 'http://localhost:8000'

export default function HistoryPage() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/cases/`)
      .then(r => r.json())
      .then(data => setCases(Array.isArray(data) ? data : []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-800">Case History</h1>
        <p className="text-charcoal-400 text-sm mt-0.5">All submitted disease scans and their verification status</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : cases.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3">📋</div>
          <h3 className="font-bold text-charcoal-700 mb-2">No cases yet</h3>
          <p className="text-charcoal-400 text-sm mb-6">Submit a disease scan to see it here.</p>
          <Link to="/disease" className="btn-primary">Scan a Crop</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map(c => {
            const conf = Math.round(c.confidence * 100)
            const statusCls = `status-${c.status.toLowerCase()}`
            const riskColor = c.risk_level === 'HIGH' ? 'text-red-600' : c.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
            return (
              <div key={c.id} className="card p-5 flex items-center gap-5">
                <div className="w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center text-xl flex-shrink-0">🌿</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-charcoal-800 text-sm truncate">{c.disease}</p>
                    <span className={statusCls}>{c.status}</span>
                  </div>
                  <p className="text-xs text-charcoal-400">{c.crop} · {c.village} · <span className={`font-semibold ${riskColor}`}>{c.risk_level} RISK</span></p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-charcoal-700">{conf}%</p>
                  <p className="text-[10px] text-charcoal-400">AI Conf.</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}