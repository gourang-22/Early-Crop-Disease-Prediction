import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const LANGUAGES = [
  { code: 'en-IN', label: '🇮🇳 English' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'mr-IN', label: 'मराठी' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', phone: '', location: '', language: 'en-IN', password: '', confirm: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await register({
        name: form.name,
        phone: form.phone,
        location: form.location,
        language: form.language,
        password: form.password,
      })
      navigate('/onboarding')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-2xl shadow-md">🌱</div>
          <div>
            <p className="font-bold text-forest-800 text-base leading-none">KrishiScan</p>
            <p className="text-charcoal-400 text-xs mt-0.5">Create your farmer account</p>
          </div>
        </div>

        <div className="card p-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-charcoal-800 mb-1">Create Account</h2>
          <p className="text-charcoal-400 text-sm mb-6">You'll set up your farm in the next step.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Your name" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" placeholder="10-digit number" value={form.phone} onChange={set('phone')} required />
              </div>
              <div>
                <label className="form-label">District / Location</label>
                <input className="form-input" placeholder="e.g. Nashik, Maharashtra" value={form.location} onChange={set('location')} required />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input type="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Preferred Language</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {LANGUAGES.map(({ code, label }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setForm({ ...form, language: code })}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                        form.language === code
                          ? 'bg-forest-700 text-white border-forest-700'
                          : 'bg-white text-charcoal-600 border-earth-200 hover:border-forest-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-charcoal-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-forest-600 font-semibold hover:text-forest-500">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
