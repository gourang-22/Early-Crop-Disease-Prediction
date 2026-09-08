import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const WEEKLY_RISK = [
  { day: 'Mon', risk: 42 },
  { day: 'Tue', risk: 55 },
  { day: 'Wed', risk: 63 },
  { day: 'Thu', risk: 71 },
  { day: 'Fri', risk: 78 },
  { day: 'Sat', risk: 82 },
  { day: 'Sun', risk: 80 },
]

const FACTORS = [
  { label: 'Humidity', value: 88, unit: '%', status: 'danger', icon: '💧' },
  { label: 'Temperature', value: 24, unit: '°C', status: 'normal', icon: '🌡️' },
  { label: 'Recent Rainfall', value: 47, unit: 'mm', status: 'warning', icon: '🌧️' },
  { label: 'Wind Speed', value: 12, unit: 'km/h', status: 'normal', icon: '🌬️' },
]

const DISEASES_AT_RISK = [
  { name: 'Early Blight', probability: 78, pathogen: 'Alternaria solani' },
  { name: 'Late Blight', probability: 54, pathogen: 'Phytophthora infestans' },
  { name: 'Leaf Curl Virus', probability: 32, pathogen: 'Begomovirus' },
]

function MiniBar({ value, className }) {
  return (
    <div className="h-full flex items-end">
      <div
        className={`w-full rounded-t-md transition-all duration-700 ${className}`}
        style={{ height: `${value}%` }}
      />
    </div>
  )
}

export default function CropHealthPage() {
  const { activeFarm } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal-800">Crop Health Analytics</h1>
        <p className="text-charcoal-400 text-sm mt-0.5">
          {activeFarm ? `${activeFarm.name} · ${activeFarm.crop} · ${activeFarm.growth_stage}` : 'Select a farm from the topbar'}
        </p>
      </div>

      {/* Risk trend chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-charcoal-800">7-Day Disease Risk Trend</h2>
            <p className="text-xs text-charcoal-400 mt-0.5">Composite risk score based on weather + crop stage</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-red-600">82%</p>
            <p className="text-xs text-red-500 font-semibold">↑ +11% from last week</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-40 mb-2">
          {WEEKLY_RISK.map((d, i) => {
            const cls = d.risk >= 70 ? 'bg-red-400' : d.risk >= 50 ? 'bg-yellow-400' : 'bg-forest-400'
            const isToday = i === WEEKLY_RISK.length - 2
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full">
                <div className={`w-full h-full flex items-end ${isToday ? 'opacity-100' : 'opacity-70'}`}>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-700 ${cls} ${isToday ? 'ring-2 ring-offset-1 ring-red-300' : ''}`}
                    style={{ height: `${d.risk}%` }}
                    title={`${d.day}: ${d.risk}%`}
                  />
                </div>
                <p className="text-[10px] text-charcoal-400 font-medium">{d.day}</p>
                <p className="text-[10px] font-bold text-charcoal-600">{d.risk}%</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environmental factors */}
        <div className="card p-6">
          <h2 className="font-bold text-charcoal-800 mb-4">Environmental Factors</h2>
          <div className="space-y-4">
            {FACTORS.map(f => {
              const barClass = f.status === 'danger' ? 'risk-high' : f.status === 'warning' ? 'risk-medium' : 'risk-low'
              const pct = Math.min((f.value / (f.unit === '%' ? 100 : f.unit === '°C' ? 45 : f.unit === 'mm' ? 100 : 60)) * 100, 100)
              const badgeClass = f.status === 'danger' ? 'badge-high' : f.status === 'warning' ? 'badge-medium' : 'badge-low'
              const badgeLabel = f.status === 'danger' ? 'HIGH' : f.status === 'warning' ? 'MODERATE' : 'NORMAL'
              return (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{f.icon}</span>
                      <span className="text-sm font-medium text-charcoal-700">{f.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-charcoal-800">{f.value}{f.unit}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>{badgeLabel}</span>
                    </div>
                  </div>
                  <div className="risk-bar-wrap">
                    <div className={`risk-bar ${barClass}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Disease probability */}
        <div className="card p-6">
          <h2 className="font-bold text-charcoal-800 mb-1">Disease Probability</h2>
          <p className="text-xs text-charcoal-400 mb-4">AI-predicted likelihood for {activeFarm?.crop || 'Tomato'}</p>
          <div className="space-y-4">
            {DISEASES_AT_RISK.map(d => {
              const cls = d.probability >= 70 ? 'risk-high' : d.probability >= 40 ? 'risk-medium' : 'risk-low'
              const tc = d.probability >= 70 ? 'text-red-700' : d.probability >= 40 ? 'text-yellow-700' : 'text-green-700'
              return (
                <div key={d.name}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <div>
                      <p className="text-sm font-semibold text-charcoal-800">{d.name}</p>
                      <p className="text-[10px] text-charcoal-400 italic">{d.pathogen}</p>
                    </div>
                    <span className={`text-sm font-bold ${tc}`}>{d.probability}%</span>
                  </div>
                  <div className="risk-bar-wrap">
                    <div className={`risk-bar ${cls}`} style={{ width: `${d.probability}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <Link to="/disease" className="btn-primary w-full justify-center mt-6 text-sm">
            📷 Run Disease Scan Now
          </Link>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card p-6">
        <h2 className="font-bold text-charcoal-800 mb-4">AI Recommendations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔍', title: 'Inspect Within 24h', desc: 'High humidity levels create ideal conditions for fungal spread. Manual inspection is strongly recommended.', urgent: true },
            { icon: '💊', title: 'Preventive Spray', desc: 'Consider applying Mancozeb-based fungicide before symptoms appear, especially on lower leaves.', urgent: false },
            { icon: '🌊', title: 'Improve Drainage', desc: 'Waterlogging around roots increases disease risk. Ensure proper field drainage after recent rainfall.', urgent: false },
          ].map(r => (
            <div key={r.title} className={`rounded-xl p-4 border ${r.urgent ? 'bg-red-50 border-red-200' : 'bg-sage-50 border-sage-200'}`}>
              <span className="text-2xl mb-2 block">{r.icon}</span>
              <h3 className={`font-semibold text-sm mb-1 ${r.urgent ? 'text-red-800' : 'text-sage-800'}`}>{r.title}</h3>
              <p className={`text-xs leading-relaxed ${r.urgent ? 'text-red-700' : 'text-sage-700'}`}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
