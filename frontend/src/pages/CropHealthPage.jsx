import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWeather } from '../context/WeatherContext'

const URGENCY_STYLE = {
  high:   'precaution-high   border text-red-800',
  medium: 'precaution-medium border text-yellow-800',
  low:    'precaution-low    border text-green-800',
}

function SkeletonBar() {
  return <div className="skeleton h-20 rounded-xl" />
}

export default function CropHealthPage() {
  const { user, activeFarm } = useAuth()
  const { weatherData, weatherLoading, weatherError, fetchWeather } = useWeather()

  useEffect(() => {
    if (activeFarm) {
      const farmCity = `${activeFarm.village ? activeFarm.village + ', ' : ''}${activeFarm.district}, ${activeFarm.state}`
      fetchWeather(
        activeFarm.latitude || null,
        activeFarm.longitude || null,
        farmCity,
        activeFarm.crop,
        activeFarm.growth_stage
      )
    }
  }, [activeFarm, fetchWeather])

  const noFarm = !activeFarm

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal-800">Crop Health Analytics</h1>
        <p className="text-charcoal-400 text-sm mt-0.5">
          {activeFarm ? `${activeFarm.name} · ${activeFarm.crop} · ${activeFarm.growth_stage}` : 'Select a farm from the topbar'}
          {weatherData?.city && <span className="ml-2 text-forest-600">· 📍 {weatherData.city}</span>}
        </p>
      </div>

      {/* No active farm state */}
      {noFarm && (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">🌾</div>
          <h3 className="text-lg font-bold text-charcoal-700 mb-2">No Active Farm Selected</h3>
          <p className="text-charcoal-400 text-sm mb-5">
            Add or select a farm to see live weather risk trends, forecasts, and crop precautions.
          </p>
          <Link to="/farms" className="btn-primary">+ Add a Farm</Link>
        </div>
      )}

      {/* 6-day risk chart */}
      {!noFarm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-charcoal-800">6-Day Disease Risk Trend</h2>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Past 3 days (actual) · Next 3 days (forecast)
              </p>
            </div>
            {!weatherLoading && weatherData && (
              <div className="text-right">
                <p className={`text-3xl font-bold ${
                  weatherData.overall_risk_level === 'HIGH' ? 'text-red-600'
                  : weatherData.overall_risk_level === 'MEDIUM' ? 'text-yellow-600'
                  : 'text-green-600'
                }`}>{weatherData.overall_risk}%</p>
                <p className={`text-xs font-semibold ${
                  weatherData.overall_risk_level === 'HIGH' ? 'text-red-500'
                  : weatherData.overall_risk_level === 'MEDIUM' ? 'text-yellow-500'
                  : 'text-green-500'
                }`}>{weatherData.overall_risk_level} RISK</p>
              </div>
            )}
          </div>

          {weatherLoading ? (
            <div className="flex items-end gap-2 h-44">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-1 skeleton rounded-lg" style={{ height: `${40 + Math.random() * 60}%` }} />
              ))}
            </div>
          ) : weatherData?.days ? (
            <>
              {/* Legend */}
              <div className="flex items-center gap-4 mb-3 text-xs text-charcoal-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-400 inline-block" /> Past (actual)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-300 opacity-70 inline-block" /> Forecast
                </span>
              </div>
              {/* Bar chart */}
              <div className="flex items-end gap-2 h-44 mb-3">
                {weatherData.days.map((d) => {
                  const barCls = d.risk_score >= 70 ? 'bg-red-400' : d.risk_score >= 40 ? 'bg-yellow-400' : 'bg-forest-400'
                  const forecastCls = d.risk_score >= 70 ? 'bg-red-300' : d.risk_score >= 40 ? 'bg-yellow-300' : 'bg-blue-300'
                  const dayLabel = new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })
                  const dateLabel = new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full">
                      <div className={`w-full h-full flex items-end ${d.is_forecast ? 'opacity-70' : ''}`}>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-700 ${d.is_forecast ? forecastCls : barCls}`}
                          style={{
                            height: `${d.risk_score}%`,
                            backgroundImage: d.is_forecast
                              ? 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.3) 4px,rgba(255,255,255,0.3) 8px)'
                              : 'none'
                          }}
                          title={`${d.date}: ${d.risk_score}% (${d.is_forecast ? 'Forecast' : 'Actual'})`}
                        />
                      </div>
                      <p className="text-[10px] text-charcoal-400 font-medium">{dayLabel}</p>
                      <p className="text-[10px] font-bold text-charcoal-600">{d.risk_score}%</p>
                      {d.is_forecast && <p className="text-[9px] text-blue-400 font-medium">fcst</p>}
                    </div>
                  )
                })}
              </div>
            </>
          ) : weatherError ? (
            <div className="text-center py-8 text-charcoal-400">
              <p>⚠️ Weather data unavailable. Check your connection.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Environmental factors + Disease probability */}
      {!noFarm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Live environmental factors */}
          <div className="card p-6">
            <h2 className="font-bold text-charcoal-800 mb-4">Live Environmental Factors</h2>
            {weatherLoading ? (
              <div className="space-y-4">{[...Array(4)].map((_,i)=><SkeletonBar key={i} />)}</div>
            ) : weatherData ? (() => {
              const today = weatherData.days.find(d => !d.is_forecast) || weatherData.days[0]
              const factors = [
                { label: 'Humidity', value: today?.humidity_max, unit: '%', max: 100, icon: '💧',
                  status: today?.humidity_max >= 80 ? 'danger' : today?.humidity_max >= 60 ? 'warning' : 'normal' },
                { label: 'Temperature', value: today?.temp_max, unit: '°C', max: 45, icon: '🌡️',
                  status: (today?.temp_max >= 20 && today?.temp_max <= 28) ? 'warning' : 'normal' },
                { label: 'Rainfall', value: today?.rainfall, unit: 'mm', max: 100, icon: '🌧️',
                  status: today?.rainfall >= 30 ? 'danger' : today?.rainfall >= 10 ? 'warning' : 'normal' },
                { label: 'Wind Speed', value: today?.wind_max, unit: 'km/h', max: 60, icon: '🌬️',
                  status: 'normal' },
              ]
              return (
                <div className="space-y-4">
                  {factors.map(f => {
                    const barClass = f.status === 'danger' ? 'risk-high' : f.status === 'warning' ? 'risk-medium' : 'risk-low'
                    const pct = Math.min(((f.value || 0) / f.max) * 100, 100)
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
                            <span className="text-sm font-bold text-charcoal-800">{f.value ?? '—'}{f.unit}</span>
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
              )
            })() : <p className="text-charcoal-400 text-sm">No data available</p>}
          </div>

          {/* Disease probability */}
          <div className="card p-6">
            <h2 className="font-bold text-charcoal-800 mb-1">Disease Risk by Day</h2>
            <p className="text-xs text-charcoal-400 mb-4">Computed from live weather for {activeFarm?.crop || 'your crop'}</p>
            {weatherLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_,i)=><SkeletonBar key={i} />)}</div>
            ) : weatherData?.days ? (
              <div className="space-y-3">
                {weatherData.days.map(d => {
                  const cls = d.risk_score >= 70 ? 'risk-high' : d.risk_score >= 40 ? 'risk-medium' : 'risk-low'
                  const tc  = d.risk_score >= 70 ? 'text-red-700' : d.risk_score >= 40 ? 'text-yellow-700' : 'text-green-700'
                  const label = new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                  return (
                    <div key={d.date}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <div>
                          <p className="text-sm font-semibold text-charcoal-800">{label}</p>
                          <p className="text-[10px] text-charcoal-400">{d.is_forecast ? 'Forecast' : 'Actual'} · {d.humidity_max}% humidity · {d.rainfall}mm rain</p>
                        </div>
                        <span className={`text-sm font-bold ${tc}`}>{d.risk_score}%</span>
                      </div>
                      <div className="risk-bar-wrap">
                        <div
                          className={`risk-bar ${cls}`}
                          style={{
                            width: `${d.risk_score}%`,
                            backgroundImage: d.is_forecast
                              ? 'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.25) 4px,rgba(255,255,255,0.25) 8px)'
                              : 'none',
                            opacity: d.is_forecast ? 0.7 : 1,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            <Link to="/disease" className="btn-primary w-full justify-center mt-5 text-sm">
              📷 Run Disease Scan Now
            </Link>
          </div>
        </div>
      )}

      {/* Precautions Card */}
      {!noFarm && weatherData?.precautions?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-charcoal-800">AI-Recommended Precautions</h2>
            <span className="text-xs text-charcoal-400">Based on 6-day weather analysis</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {weatherData.precautions.map((p, i) => (
              <div key={i} className={`rounded-xl p-4 border ${URGENCY_STYLE[p.urgency] || URGENCY_STYLE.low}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{p.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
                    <p className="text-xs leading-relaxed opacity-90">{p.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading precautions */}
      {!noFarm && weatherLoading && (
        <div className="card p-6">
          <div className="skeleton h-6 w-48 mb-4 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        </div>
      )}
    </div>
  )
}
