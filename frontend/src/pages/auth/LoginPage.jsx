import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-fill demo credentials
  const fillDemo = (type) => {
    if (type === 'farmer') setForm({ phone: '1234567890', password: 'password123' })
    if (type === 'officer') setForm({ phone: '0987654321', password: 'password123' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userData = await login(form.phone, form.password)
      if (userData.is_officer) {
        navigate('/officer')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-forest-900 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-forest-500 flex items-center justify-center text-2xl shadow-lg">🌱</div>
            <span className="text-white font-bold text-xl">KrishiScan</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-snug mb-4">
            Intelligent Crop Health<br />
            <span className="text-forest-300">for Indian Farmers</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-md">
            AI-powered disease detection, early warning alerts, and expert verification — all in one platform.
          </p>

          {/* Stats row */}
          <div className="flex gap-8 mt-12">
            {[
              { value: '91%', label: 'Detection Accuracy' },
              { value: '24h', label: 'Early Warning' },
              { value: '6+', label: 'Indian Languages' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-forest-300">{s.value}</p>
                <p className="text-white/50 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-sm relative z-10">
          Smart India Hackathon 2026 · Agriculture Intelligence
        </p>

        {/* Decorative circles */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-forest-700/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-16 w-64 h-64 bg-forest-600/20 rounded-full blur-2xl" />
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-earth-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-forest-600 flex items-center justify-center text-xl">🌱</div>
            <span className="text-forest-800 font-bold text-lg">KrishiScan</span>
          </div>

          <h2 className="text-2xl font-bold text-charcoal-800 mb-1">Welcome back</h2>
          <p className="text-charcoal-400 text-sm mb-8">Sign in to your account</p>

          {/* Demo shortcuts */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-blue-700 mb-2">🚀 Demo Quick Login</p>
            <div className="flex gap-2">
              <button
                onClick={() => fillDemo('farmer')}
                className="flex-1 text-xs bg-white border border-blue-200 text-blue-700 rounded-lg py-2 px-3 font-semibold hover:bg-blue-50 transition"
              >
                👨‍🌾 Demo Farmer
              </button>
              <button
                onClick={() => fillDemo('officer')}
                className="flex-1 text-xs bg-white border border-blue-200 text-blue-700 rounded-lg py-2 px-3 font-semibold hover:bg-blue-50 transition"
              >
                👮 Agri Officer
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-charcoal-400 mt-6">
            New to KrishiScan?{' '}
            <Link to="/register" className="text-forest-600 font-semibold hover:text-forest-500">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
