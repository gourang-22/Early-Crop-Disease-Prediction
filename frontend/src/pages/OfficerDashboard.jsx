import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import ValidationModal from '../components/ValidationModal'

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const API = 'http://localhost:8000'

function StatBadge({ label, value, color }) {
  const colors = {
    yellow:  'bg-yellow-100 text-yellow-800 border-yellow-200',
    green:   'bg-green-100 text-green-800 border-green-200',
    red:     'bg-red-100 text-red-800 border-red-200',
    charcoal: 'bg-charcoal-100 text-charcoal-700 border-charcoal-200',
  }
  return (
    <div className={`card p-5 border ${colors[color] || colors.charcoal}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide mt-1 opacity-70">{label}</p>
    </div>
  )
}

function CaseRow({ c, onClick }) {
  const statusCls = `status-${c.status.toLowerCase()}`
  const conf = Math.round(c.confidence * 100)
  const riskCls = c.risk_level === 'HIGH' ? 'text-red-600' : c.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'

  return (
    <div
      className={`border rounded-xl p-4 cursor-pointer transition ${
        c.status === 'Suspected'
          ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-400'
          : c.status === 'Confirmed'
          ? 'border-green-200 bg-white hover:border-green-300'
          : 'border-red-200 bg-white hover:border-red-300 opacity-70'
      }`}
      onClick={() => onClick(c)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-charcoal-400">#{c.id} · {c.village}</span>
        <span className={statusCls}>{c.status}</span>
      </div>
      <p className="font-bold text-charcoal-800 text-sm mb-1">{c.disease}</p>
      <div className="flex items-center justify-between text-xs text-charcoal-500">
        <span>{c.crop}</span>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${riskCls}`}>{c.risk_level}</span>
          <span className="text-charcoal-300">·</span>
          <span>{conf}% conf.</span>
        </div>
      </div>
    </div>
  )
}

export default function OfficerDashboard() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState(null)
  const [learningMsg, setLearningMsg] = useState('')
  const [filter, setFilter] = useState('ALL')

  const fetchCases = async () => {
    try {
      const res = await fetch(`${API}/cases/`)
      const data = await res.json()
      setCases(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCases() }, [])

  const handleValidate = (updatedCase, status) => {
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c))
    if (status === 'Confirmed') {
      setLearningMsg('✅ Diagnosis Confirmed. Field data logged for model improvement (LEARN stage).')
      setTimeout(() => setLearningMsg(''), 5000)
    } else {
      setLearningMsg('✗ Case Rejected. Officer review recorded.')
      setTimeout(() => setLearningMsg(''), 5000)
    }
  }

  const nashikCenter = [19.9975, 73.7898]
  const confirmedCount = cases.filter(c => c.status === 'Confirmed').length
  const suspectedCount = cases.filter(c => c.status === 'Suspected').length
  const rejectedCount = cases.filter(c => c.status === 'Rejected').length

  const filtered = filter === 'ALL' ? cases : cases.filter(c => c.status === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800">Officer Dashboard</h1>
          <p className="text-charcoal-400 text-sm mt-0.5">Monitor disease hotspots · Validate AI diagnoses · Manage field inspections</p>
        </div>
        <span className="bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-full">
          👮 Officer Portal
        </span>
      </div>

      {/* Learning notification */}
      {learningMsg && (
        <div className="bg-green-50 border border-green-300 text-green-800 px-5 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
          <span className="text-xl flex-shrink-0">🎓</span>
          <span className="text-sm font-medium">{learningMsg}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBadge label="Total Cases" value={cases.length} color="charcoal" />
        <StatBadge label="Awaiting Review" value={suspectedCount} color="yellow" />
        <StatBadge label="Confirmed" value={confirmedCount} color="green" />
        <StatBadge label="Rejected" value={rejectedCount} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-earth-100 flex justify-between items-center bg-earth-50">
            <div>
              <h2 className="font-bold text-charcoal-800 text-sm">Geospatial Risk Map</h2>
              <p className="text-xs text-charcoal-400">Nashik District · Real-time hotspots</p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-red-600"><span className="w-2.5 h-2.5 bg-red-400 rounded-full opacity-60" />Hotspot</span>
              <span className="flex items-center gap-1.5 text-blue-600"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />Cases</span>
            </div>
          </div>
          <div className="h-[420px] w-full z-0">
            <MapContainer center={nashikCenter} zoom={12} scrollWheelZoom={false} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Circle
                center={[20.01, 73.80]}
                radius={2000}
                pathOptions={{ color: '#dc2626', fillColor: '#fca5a5', fillOpacity: 0.35 }}
              >
                <Popup>
                  <strong>Village D — Early Blight Hotspot</strong><br />
                  Risk: HIGH<br />
                  Suspected: {suspectedCount} · Confirmed: {confirmedCount}
                </Popup>
              </Circle>
              <Circle
                center={[19.98, 73.76]}
                radius={1400}
                pathOptions={{ color: '#d97706', fillColor: '#fde68a', fillOpacity: 0.3 }}
              >
                <Popup>
                  <strong>Village B — Moderate Risk</strong><br />
                  Risk: MEDIUM<br />
                  Monitoring active
                </Popup>
              </Circle>
              {cases.map((c, i) => (
                <Marker key={c.id} position={[20.01 + (i * 0.005), 73.80 + (i * 0.005)]}>
                  <Popup>
                    <strong>Case #{c.id}</strong><br />
                    Disease: {c.disease}<br />
                    Status: {c.status}<br />
                    Confidence: {Math.round(c.confidence * 100)}%
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Validation queue */}
        <div className="card flex flex-col" style={{ maxHeight: '500px' }}>
          <div className="p-4 border-b border-earth-100 bg-earth-50 flex-shrink-0">
            <h2 className="font-bold text-charcoal-800 text-sm">Validation Queue</h2>
            <div className="flex gap-1 mt-2">
              {['ALL', 'Suspected', 'Confirmed', 'Rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold transition ${
                    filter === f ? 'bg-forest-700 text-white border-forest-700' : 'bg-white text-charcoal-500 border-earth-200'
                  }`}
                >
                  {f === 'ALL' ? `All (${cases.length})` : f === 'Suspected' ? `Pending (${suspectedCount})` : f === 'Confirmed' ? `OK (${confirmedCount})` : `Rej. (${rejectedCount})`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-sm text-charcoal-400">No {filter !== 'ALL' ? filter.toLowerCase() + ' ' : ''}cases</p>
              </div>
            ) : (
              filtered.map(c => (
                <CaseRow key={c.id} c={c} onClick={setSelectedCase} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Validation modal */}
      {selectedCase && (
        <ValidationModal
          case={selectedCase}
          onClose={() => setSelectedCase(null)}
          onValidate={handleValidate}
        />
      )}
    </div>
  )
}
