import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useWeather } from '../context/WeatherContext'
import { useToast, ToastContainer } from '../components/Toast'

const LANGUAGES = [
  { code: 'en-IN', label: 'English', flag: '🇮🇳' },
  { code: 'hi-IN', label: 'हिंदी',   flag: '🇮🇳' },
  { code: 'mr-IN', label: 'मराठी',   flag: '🇮🇳' },
  { code: 'ta-IN', label: 'தமிழ்',  flag: '🇮🇳' },
  { code: 'te-IN', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ',  flag: '🇮🇳' },
]

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl avatar-gradient flex items-center justify-center text-xl shadow-sm">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-charcoal-800 text-base">{title}</h2>
          {subtitle && <p className="text-xs text-charcoal-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

// City autocomplete using Open-Meteo geocoding (no API key needed)
function CitySearch({ value, onChange, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); return }
    setSearching(true)
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`
      )
      const data = await res.json()
      setSuggestions(data.results || [])
    } catch {
      setSuggestions([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    onChange(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 350)
  }

  const handleSelect = (item) => {
    const cityName = `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}${item.country_code ? ', ' + item.country_code : ''}`
    setQuery(cityName)
    setSuggestions([])
    onSelect({ city: cityName, latitude: item.latitude, longitude: item.longitude })
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          className="form-input pr-10"
          placeholder="Type a city (e.g. Nashik, Pune, Delhi)..."
          value={query}
          onChange={handleChange}
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-forest-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="suggestion-list">
          {suggestions.map((item) => (
            <div
              key={`${item.latitude}-${item.longitude}`}
              className="suggestion-item"
              onClick={() => handleSelect(item)}
            >
              <span className="font-medium text-charcoal-800">{item.name}</span>
              <span className="text-charcoal-400 text-xs ml-2">
                {[item.admin1, item.country].filter(Boolean).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth()
  const { refreshWeather } = useWeather()
  const { toasts, showToast } = useToast()

  // Account info state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    location: user?.location || '',
    language: user?.language || 'en-IN',
  })
  const [profileSaving, setProfileSaving] = useState(false)

  // Location state
  const [locationForm, setLocationForm] = useState({
    city: user?.city || '',
    latitude: user?.latitude || null,
    longitude: user?.longitude || null,
  })
  const [locationSaving, setLocationSaving] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [locationSet, setLocationSet] = useState(!!(user?.latitude && user?.longitude))

  // Password state
  const [pwForm, setPwForm] = useState({ old: '', newPw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!profileForm.name.trim()) return showToast({ message: 'Name cannot be empty', type: 'error' })
    setProfileSaving(true)
    try {
      await updateProfile({
        name: profileForm.name.trim(),
        location: profileForm.location.trim(),
        language: profileForm.language,
      })
      showToast({ message: 'Profile updated successfully!', type: 'success' })
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleGpsLocation = () => {
    if (!navigator.geolocation) {
      return showToast({ message: 'GPS not supported in this browser', type: 'error' })
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        // Reverse geocode using Open-Meteo
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || 'Your Location'
          const state = data.address?.state || ''
          const cityName = state ? `${city}, ${state}` : city
          setLocationForm({ city: cityName, latitude, longitude })
          setLocationSet(true)
          showToast({ message: `📍 Location detected: ${cityName}`, type: 'success' })
        } catch {
          // Still use coords even if reverse geocoding fails
          setLocationForm({ city: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`, latitude, longitude })
          setLocationSet(true)
          showToast({ message: '📍 GPS location acquired', type: 'success' })
        }
        setGpsLoading(false)
      },
      (err) => {
        setGpsLoading(false)
        const msg = err.code === 1
          ? 'Location permission denied. Please allow GPS access.'
          : 'Could not get GPS location. Try searching manually.'
        showToast({ message: msg, type: 'error' })
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleSaveLocation = async () => {
    if (!locationForm.latitude || !locationForm.longitude) {
      return showToast({ message: 'Please detect GPS or select a city first', type: 'error' })
    }
    setLocationSaving(true)
    try {
      await updateProfile({
        city: locationForm.city,
        latitude: locationForm.latitude,
        longitude: locationForm.longitude,
      })
      // Refresh weather with new location
      if (user) {
        refreshWeather(locationForm.latitude, locationForm.longitude, locationForm.city)
      }
      showToast({ message: `Location saved — weather will update for ${locationForm.city}!`, type: 'success' })
      setLocationSet(true)
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setLocationSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) {
      return showToast({ message: 'New passwords do not match', type: 'error' })
    }
    if (pwForm.newPw.length < 6) {
      return showToast({ message: 'Password must be at least 6 characters', type: 'error' })
    }
    setPwSaving(true)
    try {
      await changePassword(pwForm.old, pwForm.newPw)
      setPwForm({ old: '', newPw: '', confirm: '' })
      showToast({ message: 'Password changed successfully!', type: 'success' })
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setPwSaving(false)
    }
  }

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl avatar-gradient flex items-center justify-center text-3xl font-bold text-white shadow-lg flex-shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800">{user?.name}</h1>
          <p className="text-charcoal-400 text-sm mt-0.5">📞 {user?.phone}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {user?.is_officer
              ? <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold">👮 Agricultural Officer</span>
              : <span className="text-xs bg-forest-100 text-forest-700 border border-forest-200 px-2.5 py-0.5 rounded-full font-semibold">🧑‍🌾 Farmer</span>
            }
            {user?.location && (
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full font-semibold">
                📍 {user.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <SectionCard title="Account Information" subtitle="Edit your display name, region and language" icon="👤">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              value={profileForm.name}
              onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="form-label">Location / Region</label>
            <input
              className="form-input"
              value={profileForm.location}
              onChange={e => setProfileForm(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Nashik, Maharashtra"
            />
          </div>
          <div>
            <label className="form-label">Preferred Language</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setProfileForm(p => ({ ...p, language: lang.code }))}
                  className={`text-sm px-3 py-1.5 rounded-full border font-medium transition ${
                    profileForm.language === lang.code
                      ? 'bg-forest-700 text-white border-forest-700 shadow-sm'
                      : 'bg-white text-charcoal-600 border-earth-200 hover:border-forest-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-1">
            <button type="submit" disabled={profileSaving} className="btn-primary">
              {profileSaving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Security */}
      <SectionCard title="Change Password" subtitle="Use a strong password with at least 6 characters" icon="🔐">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={pwForm.old}
              onChange={e => setPwForm(p => ({ ...p, old: e.target.value }))}
              placeholder="Enter current password"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={pwForm.newPw}
                onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                placeholder="New password"
              />
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat new password"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <button type="submit" disabled={pwSaving || !pwForm.old || !pwForm.newPw} className="btn-primary">
              {pwSaving ? 'Changing...' : '🔒 Change Password'}
            </button>
          </div>
        </form>
      </SectionCard>

      <ToastContainer toasts={toasts} />
    </div>
  )
}
