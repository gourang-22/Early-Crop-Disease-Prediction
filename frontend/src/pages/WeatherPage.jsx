import { useState, useEffect } from 'react'

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID

const INDIAN_CITIES = [
  { name: 'Mumbai',     lat: 19.076,  lon: 72.877  },
  { name: 'Delhi',      lat: 28.679,  lon: 77.069  },
  { name: 'Pune',       lat: 18.520,  lon: 73.856  },
  { name: 'Nagpur',     lat: 21.145,  lon: 79.088  },
  { name: 'Jaipur',     lat: 26.912,  lon: 75.787  },
  { name: 'Lucknow',    lat: 26.846,  lon: 80.946  },
  { name: 'Bhopal',     lat: 23.259,  lon: 77.413  },
  { name: 'Hyderabad',  lat: 17.385,  lon: 78.486  },
  { name: 'Chennai',    lat: 13.083,  lon: 80.270  },
  { name: 'Kolkata',    lat: 22.572,  lon: 88.363  },
  { name: 'Ahmedabad',  lat: 23.022,  lon: 72.571  },
  { name: 'Patna',      lat: 25.594,  lon: 85.137  },
  { name: 'Bengaluru',  lat: 12.972,  lon: 77.594  },
  { name: 'Thane',      lat: 19.218,  lon: 72.978  },
  { name: 'Nashik',     lat: 19.997,  lon: 73.791  },
]

function getAlerts(weather) {
  const alerts = []
  const { temperature_2m_max, precipitation_sum, windspeed_10m_max, temperature_2m_min } = weather

  if (precipitation_sum >= 50)
    alerts.push({ type: 'Heavy Rain', icon: '🌧️', color: 'blue',
      msg: `Heavy rainfall of ${precipitation_sum}mm expected. Avoid field work, protect crops from waterlogging.` })

  if (precipitation_sum >= 100)
    alerts.push({ type: 'Flood Risk', icon: '🌊', color: 'red',
      msg: `Extreme rainfall of ${precipitation_sum}mm! High flood risk. Move livestock to higher ground immediately.` })

  if (temperature_2m_max >= 42)
    alerts.push({ type: 'Extreme Heat', icon: '🌡️', color: 'orange',
      msg: `Dangerous heat of ${temperature_2m_max}°C expected. Irrigate early morning, avoid afternoon field work.` })

  if (temperature_2m_min <= 5)
    alerts.push({ type: 'Frost Warning', icon: '❄️', color: 'cyan',
      msg: `Temperature dropping to ${temperature_2m_min}°C. Risk of frost damage. Cover sensitive crops tonight.` })

  if (windspeed_10m_max >= 40)
    alerts.push({ type: 'Strong Winds', icon: '💨', color: 'yellow',
      msg: `Winds up to ${windspeed_10m_max} km/h expected. Secure structures, avoid spraying pesticides today.` })

  return alerts
}

async function sendTelegramAlert(city, alerts, weather) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return false

  const lines = [
    `🌾 *KrishiScan Weather Alert*`,
    `📍 Location: *${city}*`,
    `📅 Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`,
    ``,
    `⚠️ *${alerts.length} Alert${alerts.length > 1 ? 's' : ''} Detected:*`,
    ``,
    ...alerts.map(a => `${a.icon} *${a.type}*\n${a.msg}`),
    ``,
    `🌡️ Max Temp: ${weather.temperature_2m_max}°C | Min: ${weather.temperature_2m_min}°C`,
    `🌧️ Rainfall: ${weather.precipitation_sum}mm`,
    `💨 Wind: ${weather.windspeed_10m_max} km/h`,
    ``,
    `_Stay safe. From KrishiScan 🌱_`,
  ]

  const text = lines.join('\n')

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown',
    }),
  })

  return res.ok
}

async function sendSafeAlert(city) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return false

  const text = [
    `✅ *KrishiScan Weather Update*`,
    `📍 Location: *${city}*`,
    `📅 ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`,
    ``,
    `All weather conditions look normal today. Safe to proceed with regular farm activities! 🌾`,
    ``,
    `_Stay safe. From KrishiScan 🌱_`,
  ].join('\n')

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
  })

  return res.ok
}

export default function WeatherPage() {
  const [city, setCity] = useState(INDIAN_CITIES[0])
  const [weather, setWeather] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  async function fetchWeather(selectedCity) {
    setLoading(true)
    setError(null)
    setSent(false)
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=Asia/Kolkata&forecast_days=1`
      const res = await fetch(url)
      const data = await res.json()

      const w = {
        temperature_2m_max: data.daily.temperature_2m_max[0],
        temperature_2m_min: data.daily.temperature_2m_min[0],
        precipitation_sum:  data.daily.precipitation_sum[0],
        windspeed_10m_max:  data.daily.windspeed_10m_max[0],
      }

      setWeather(w)
      const detected = getAlerts(w)
      setAlerts(detected)
      setLastChecked(new Date())

      // Auto-send Telegram alert if dangerous conditions found
      if (detected.length > 0) {
        setSending(true)
        await sendTelegramAlert(selectedCity.name, detected, w)
        setSending(false)
        setSent(true)
      }
    } catch {
      setError('Could not fetch weather data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather(city)
  }, [])

  function handleCityChange(e) {
    const selected = INDIAN_CITIES.find(c => c.name === e.target.value)
    setCity(selected)
    fetchWeather(selected)
  }

  async function handleManualAlert() {
    if (!weather) return
    setSending(true)
    setSent(false)
    if (alerts.length > 0) {
      await sendTelegramAlert(city.name, alerts, weather)
    } else {
      await sendSafeAlert(city.name)
    }
    setSending(false)
    setSent(true)
  }

  const ALERT_COLORS = {
    red:    'bg-red-50 border-red-200 text-red-800',
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    cyan:   'bg-cyan-50 border-cyan-200 text-cyan-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-forest-800">Weather Alerts</h2>
        <p className="text-sm text-gray-400 mt-1">
          Real-time weather monitoring with Telegram alerts for your farm
        </p>
      </div>

      {/* City selector */}
      <div className="bg-white border border-earth-100 rounded-2xl p-5 mb-5 shadow-sm">
        <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-2">
          Select your location
        </label>
        <div className="flex gap-3">
          <select
            value={city.name}
            onChange={handleCityChange}
            className="flex-1 bg-earth-50 border border-earth-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-forest-400 transition"
          >
            {INDIAN_CITIES.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => fetchWeather(city)}
            disabled={loading}
            className="px-5 py-2.5 bg-forest-700 text-white rounded-xl text-sm font-medium hover:bg-forest-600 disabled:opacity-40 transition"
          >
            {loading ? '...' : '🔄 Refresh'}
          </button>
        </div>
        {lastChecked && (
          <p className="text-xs text-gray-400 mt-2">
            Last checked: {lastChecked.toLocaleTimeString('en-IN')}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-earth-100 rounded-2xl p-10 text-center shadow-sm mb-5">
          <div className="flex gap-1.5 justify-center mb-3">
            {[0,1,2].map(i => (
              <div key={i} className="w-2.5 h-2.5 bg-forest-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <p className="text-sm text-gray-400">Fetching weather data for {city.name}...</p>
        </div>
      )}

      {/* Weather data */}
      {weather && !loading && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Max Temp',  value: `${weather.temperature_2m_max}°C`, icon: '🌡️' },
              { label: 'Min Temp',  value: `${weather.temperature_2m_min}°C`, icon: '🌙' },
              { label: 'Rainfall',  value: `${weather.precipitation_sum}mm`,  icon: '🌧️' },
              { label: 'Wind Speed',value: `${weather.windspeed_10m_max} km/h`, icon: '💨' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white border border-earth-100 rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-lg font-bold text-forest-800">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {alerts.length > 0 ? (
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-semibold text-gray-700">
                ⚠️ {alerts.length} weather alert{alerts.length > 1 ? 's' : ''} detected
              </h3>
              {alerts.map((alert, i) => (
                <div key={i} className={`border rounded-xl px-4 py-3 text-sm ${ALERT_COLORS[alert.color]}`}>
                  <p className="font-semibold mb-0.5">{alert.icon} {alert.type}</p>
                  <p className="opacity-80">{alert.msg}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-4 mb-5 text-sm text-green-800">
              <p className="font-semibold">✅ All clear for {city.name}</p>
              <p className="opacity-80 mt-0.5">No dangerous weather conditions detected today. Safe to proceed with farm activities!</p>
            </div>
          )}

          {/* Telegram alert button */}
          <div className="bg-white border border-earth-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Send Telegram Alert</p>
                <p className="text-xs text-gray-400">
                  {alerts.length > 0
                    ? 'Alert was auto-sent. Click to resend.'
                    : 'Send a safe weather update to your Telegram.'}
                </p>
              </div>
              {sent && (
                <span className="ml-auto text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                  ✓ Sent!
                </span>
              )}
            </div>
            <button
              onClick={handleManualAlert}
              disabled={sending}
              className="w-full py-3 bg-forest-700 text-white rounded-xl text-sm font-medium hover:bg-forest-600 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending to Telegram...
                </>
              ) : (
                '📨 Send Weather Alert to Telegram'
              )}
            </button>
            {!TELEGRAM_TOKEN && (
              <p className="text-xs text-red-400 mt-2 text-center">
                ⚠️ Telegram not configured — add VITE_TELEGRAM_BOT_TOKEN and VITE_TELEGRAM_CHAT_ID to .env
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}