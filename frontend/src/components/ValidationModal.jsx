import { useState } from 'react'

const API = 'http://localhost:8000'

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100)
  const cls = pct >= 85 ? 'risk-high' : pct >= 60 ? 'risk-medium' : 'risk-low'
  const color = pct >= 85 ? 'text-red-700' : pct >= 60 ? 'text-yellow-700' : 'text-green-700'
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-charcoal-400">AI Confidence</span>
        <span className={`text-sm font-bold ${color}`}>{pct}%</span>
      </div>
      <div className="risk-bar-wrap"><div className={`risk-bar ${cls}`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export default function ValidationModal({ case: c, onClose, onValidate }) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')

  const handleAction = async (status) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/cases/${c.id}/validate?status=${status}`, { method: 'POST' })
      if (res.ok) {
        const updated = await res.json()
        onValidate(updated, status)
        onClose()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const riskColor = c.risk_level === 'HIGH' ? 'badge-high' : c.risk_level === 'MEDIUM' ? 'badge-medium' : 'badge-low'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box p-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs font-mono text-charcoal-400 mb-1">CASE #{c.id}</p>
            <h2 className="text-xl font-bold text-charcoal-800">Diagnosis Validation</h2>
          </div>
          <button onClick={onClose} className="text-charcoal-300 hover:text-charcoal-600 text-2xl leading-none">×</button>
        </div>

        {/* Case details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'DETECTED DISEASE', val: c.disease, span: true },
              { label: 'CROP', val: c.crop },
              { label: 'LOCATION', val: c.village },
              { label: 'STATUS', val: c.status },
              { label: 'RISK LEVEL', val: c.risk_level },
            ].map(item => (
              <div key={item.label} className={item.span ? 'col-span-2' : ''}>
                <p className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                {item.label === 'DETECTED DISEASE' ? (
                  <p className="text-xl font-bold text-charcoal-800">{item.val}</p>
                ) : item.label === 'STATUS' ? (
                  <span className={`status-${item.val.toLowerCase()}`}>{item.val}</span>
                ) : item.label === 'RISK LEVEL' ? (
                  <span className={`${riskColor} text-xs font-bold px-2 py-0.5 rounded`}>{item.val}</span>
                ) : (
                  <p className="text-sm font-semibold text-charcoal-700">{item.val}</p>
                )}
              </div>
            ))}
          </div>

          <ConfidenceBar value={c.confidence} />

          {/* Contextual info */}
          <div className="bg-earth-50 border border-earth-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-charcoal-500 uppercase tracking-wide">Field Context</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-charcoal-400">Weather</p>
                <p className="text-sm font-semibold text-charcoal-700">High Humidity</p>
              </div>
              <div>
                <p className="text-[10px] text-charcoal-400">Temp</p>
                <p className="text-sm font-semibold text-charcoal-700">24°C</p>
              </div>
              <div>
                <p className="text-[10px] text-charcoal-400">Rainfall (7d)</p>
                <p className="text-sm font-semibold text-charcoal-700">47mm</p>
              </div>
            </div>
          </div>

          {/* Officer notes */}
          {c.status === 'Suspected' && (
            <div>
              <label className="form-label">Officer Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="form-input resize-none"
                rows={3}
                placeholder="Add any field observations or notes..."
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {c.status === 'Suspected' ? (
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleAction('Rejected')}
              disabled={loading}
              className="btn-secondary flex-1 justify-center text-red-600 border-red-200 hover:bg-red-50"
            >
              ✗ Reject Diagnosis
            </button>
            <button
              onClick={() => handleAction('Confirmed')}
              disabled={loading}
              className="btn-primary flex-1 justify-center bg-forest-600 hover:bg-forest-500"
            >
              {loading ? 'Processing...' : '✓ Confirm Diagnosis'}
            </button>
          </div>
        ) : (
          <div className={`mt-6 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${
            c.status === 'Confirmed' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {c.status === 'Confirmed' ? '✅ Confirmed — Feedback logged for model improvement' : '✗ Rejected by officer'}
          </div>
        )}
      </div>
    </div>
  )
}
