import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

const API = 'http://localhost:8000'

function ConfidenceMeter({ confidence }) {
  const pct = Math.round(confidence * 100)
  const cls = pct >= 85 ? 'risk-high' : pct >= 60 ? 'risk-medium' : 'risk-low'
  const color = pct >= 85 ? 'text-red-700' : pct >= 60 ? 'text-yellow-700' : 'text-green-700'

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wide">AI Confidence</span>
        <span className={`text-xl font-bold ${color}`}>{pct}%</span>
      </div>
      <div className="risk-bar-wrap">
        <div className={`risk-bar ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DiagnosisResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeFarm } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { result, farm, imagePreview } = location.state || {}

  // If no result in state, redirect back to scanner
  useEffect(() => {
    if (!result) navigate('/disease', { replace: true })
  }, [result, navigate])

  if (!result) return null

  const conf = result.confidence * 100
  const isHighConf = conf >= 85
  const isMedConf = conf >= 60 && conf < 85
  const isLowConf = conf < 60

  const disease = result.disease || 'Unknown'
  const displayConf = Math.round(conf)

  const riskLevel = isHighConf ? 'HIGH' : isMedConf ? 'MEDIUM' : 'LOW'
  const activeCrop = farm?.crop || activeFarm?.crop || 'Tomato'
  const activeLocation = farm?.district || activeFarm?.district || 'Nashik'

  const saveCase = async () => {
    setSaving(true)
    try {
      await fetch(`${API}/cases/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_id: farm?.id || activeFarm?.id || null,
          village: farm?.village || activeFarm?.village || 'Village D',
          crop: activeCrop,
          disease: disease,
          confidence: result.confidence,
          risk_level: riskLevel,
          status: 'Suspected',
        }),
      })
      setSaved(true)
    } catch (err) {
      console.error('Error saving case:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/disease')}
          className="w-9 h-9 rounded-xl bg-earth-100 flex items-center justify-center text-charcoal-600 hover:bg-earth-200 transition"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold text-charcoal-800">Diagnosis Result</h1>
          <p className="text-xs text-charcoal-400">AI Analysis Complete</p>
        </div>
      </div>

      {/* Main result card */}
      <div className="card p-6 space-y-5">
        {/* Disease name */}
        <div className={`rounded-xl p-5 border ${
          isHighConf ? 'bg-red-50 border-red-200' :
          isMedConf ? 'bg-yellow-50 border-yellow-200' :
          'bg-green-50 border-green-200'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest mb-1">Detected Issue</p>
              <h2 className={`text-2xl font-bold ${
                isHighConf ? 'text-red-800' : isMedConf ? 'text-yellow-800' : 'text-green-800'
              }`}>
                {disease}
              </h2>
              <p className="text-sm text-charcoal-500 mt-0.5">{activeCrop} · {activeLocation}</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isHighConf ? 'badge-high' : isMedConf ? 'badge-medium' : 'badge-low'
            }`}>
              {riskLevel} RISK
            </span>
          </div>

          <ConfidenceMeter confidence={result.confidence} />
        </div>

        {/* Image preview if available */}
        {imagePreview && (
          <div className="rounded-xl overflow-hidden border border-earth-200">
            <img src={imagePreview} alt="Scanned crop" className="w-full h-48 object-cover" />
          </div>
        )}

        {/* What this means */}
        <div>
          <h3 className="font-bold text-charcoal-800 text-sm mb-2">What This Means</h3>
          {isHighConf && (
            <p className="text-sm text-charcoal-600 leading-relaxed">
              The AI has detected <strong>{disease}</strong> with high confidence. This is a serious disease that spreads rapidly in humid conditions. Immediate action is recommended to prevent crop loss.
            </p>
          )}
          {isMedConf && (
            <p className="text-sm text-charcoal-600 leading-relaxed">
              The AI suspects <strong>{disease}</strong> but confidence is moderate. A clearer photo or a closer inspection of the affected area may improve accuracy.
            </p>
          )}
          {isLowConf && (
            <p className="text-sm text-charcoal-600 leading-relaxed">
              The AI could not determine the disease with sufficient confidence. Manual inspection by an agricultural expert is recommended.
            </p>
          )}
        </div>

        {/* Save to system */}
        {!saved ? (
          <button onClick={saveCase} disabled={saving} className="btn-secondary w-full justify-center text-sm">
            {saving ? 'Saving to System...' : '💾 Save Case for Officer Review'}
          </button>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium flex items-center gap-2">
            ✅ Case saved — awaiting officer verification
          </div>
        )}
      </div>

      {/* CTAs based on confidence */}
      <div className="space-y-3">
        <h3 className="font-bold text-charcoal-700 text-sm uppercase tracking-wide">Next Steps</h3>

        {isHighConf && (
          <>
            <Link
              to="/assistant"
              state={{ disease, crop: activeCrop, location: activeLocation }}
              className="flex items-center justify-between card card-hover border p-5 hover:border-forest-300 transition"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-bold text-charcoal-800 text-sm">Get Management Guidance</p>
                  <p className="text-xs text-charcoal-400">Ask KrishiBot for integrated pest management steps</p>
                </div>
              </div>
              <span className="text-charcoal-300 text-lg">→</span>
            </Link>
            <Link
              to="/officer"
              className="flex items-center justify-between card card-hover border p-5 hover:border-red-200 transition"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">👮</span>
                <div>
                  <p className="font-bold text-charcoal-800 text-sm">Request Expert Verification</p>
                  <p className="text-xs text-charcoal-400">An agricultural officer can confirm this diagnosis</p>
                </div>
              </div>
              <span className="text-charcoal-300 text-lg">→</span>
            </Link>
          </>
        )}

        {isMedConf && (
          <>
            <button
              onClick={() => navigate('/disease')}
              className="flex items-center justify-between card card-hover border p-5 w-full text-left hover:border-yellow-300 transition"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">📸</span>
                <div>
                  <p className="font-bold text-charcoal-800 text-sm">Retake with Better Photo</p>
                  <p className="text-xs text-charcoal-400">Closer, sharper image will improve accuracy</p>
                </div>
              </div>
              <span className="text-charcoal-300 text-lg">→</span>
            </button>
            <Link
              to="/assistant"
              state={{ disease, crop: activeCrop, location: activeLocation }}
              className="flex items-center justify-between card card-hover border p-5 hover:border-forest-300 transition"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-bold text-charcoal-800 text-sm">Ask AI Assistant</p>
                  <p className="text-xs text-charcoal-400">Get preliminary guidance for {disease}</p>
                </div>
              </div>
              <span className="text-charcoal-300 text-lg">→</span>
            </Link>
          </>
        )}

        {isLowConf && (
          <div className="card p-5 border border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏥</span>
              <div>
                <p className="font-bold text-red-800 text-sm mb-1">Expert Referral Required</p>
                <p className="text-sm text-red-700">
                  This case has been escalated to an agricultural officer for expert evaluation. You will be notified once reviewed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
