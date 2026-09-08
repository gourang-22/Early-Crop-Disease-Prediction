import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GROWTH_STAGES = ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest-ready']
const CROPS = ['Tomato', 'Cotton', 'Wheat', 'Rice', 'Soybean', 'Onion', 'Sugarcane', 'Maize', 'Chickpea', 'Other']

const STEPS = [
  { id: 1, title: 'Farm Details', description: 'Name and location of your farm' },
  { id: 2, title: 'Crop Info', description: 'What you are growing' },
  { id: 3, title: 'All Set!', description: 'Your farm is ready' },
]

export default function OnboardingPage() {
  const { addFarm, user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', village: '', district: '', state: 'Maharashtra',
    crop: 'Tomato', crop_variety: '', sowing_date: '', growth_stage: 'Vegetative', area: '',
  })

  const set = (k) => (e) => setForm({ ...form, [k]: typeof e === 'string' ? e : e.target.value })

  const nextStep = () => setStep(s => Math.min(s + 1, 3))

  const handleFinish = async () => {
    setError('')
    setLoading(true)
    try {
      await addFarm(form)
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-forest-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* BG decoration */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-forest-700/30 rounded-full blur-3xl" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-forest-600/15 rounded-full blur-2xl" />

      <div className="w-full max-w-xl relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-forest-500 flex items-center justify-center text-2xl">🌱</div>
          <span className="text-white font-bold text-xl">KrishiScan</span>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                step > s.id ? 'bg-forest-400 text-white' :
                step === s.id ? 'bg-white text-forest-900' :
                'bg-white/10 text-white/40'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className={`text-xs font-semibold truncate ${step >= s.id ? 'text-white' : 'text-white/30'}`}>{s.title}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded mx-2 ${step > s.id ? 'bg-forest-400' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl animate-fade-in">
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-charcoal-800 mb-1">
                Welcome, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p className="text-charcoal-400 text-sm mb-6">Let's set up your first farm.</p>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Farm Name</label>
                  <input className="form-input" placeholder='e.g. "My Tomato Farm"' value={form.name} onChange={set('name')} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Village / Area</label>
                    <input className="form-input" placeholder="Village name" value={form.village} onChange={set('village')} />
                  </div>
                  <div>
                    <label className="form-label">District</label>
                    <input className="form-input" placeholder="e.g. Nashik" value={form.district} onChange={set('district')} />
                  </div>
                  <div>
                    <label className="form-label">State</label>
                    <input className="form-input" value={form.state} onChange={set('state')} />
                  </div>
                  <div>
                    <label className="form-label">Farm Area</label>
                    <input className="form-input" placeholder="e.g. 2 Acres" value={form.area} onChange={set('area')} />
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!form.name}
                className="btn-primary w-full justify-center mt-6 py-3"
              >
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-charcoal-800 mb-1">Crop Information</h2>
              <p className="text-charcoal-400 text-sm mb-6">Tell us what you're growing so we can personalize alerts and AI guidance.</p>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Select Crop</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {CROPS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set('crop')(c)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                          form.crop === c
                            ? 'bg-forest-700 text-white border-forest-700'
                            : 'bg-white text-charcoal-600 border-earth-200 hover:border-forest-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Variety (optional)</label>
                    <input className="form-input" placeholder="e.g. Abhinav" value={form.crop_variety} onChange={set('crop_variety')} />
                  </div>
                  <div>
                    <label className="form-label">Sowing Date</label>
                    <input type="date" className="form-input" value={form.sowing_date} onChange={set('sowing_date')} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Current Growth Stage</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {GROWTH_STAGES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('growth_stage')(s)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                          form.growth_stage === s
                            ? 'bg-sage-700 text-white border-sage-700'
                            : 'bg-white text-charcoal-600 border-earth-200 hover:border-sage-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center py-3">← Back</button>
                <button
                  onClick={handleFinish}
                  disabled={loading || !form.crop}
                  className="btn-primary flex-1 justify-center py-3"
                >
                  {loading ? 'Saving...' : 'Save Farm →'}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-charcoal-800 mb-2">Farm Created!</h2>
              <p className="text-charcoal-500 text-sm mb-2">
                <strong>{form.name}</strong> is ready. Your AI-powered crop health monitoring has begun.
              </p>
              <div className="bg-earth-50 border border-earth-200 rounded-xl p-4 my-6 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-400">Crop</span>
                  <span className="font-semibold text-charcoal-800">{form.crop} {form.crop_variety && `(${form.crop_variety})`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-400">Location</span>
                  <span className="font-semibold text-charcoal-800">{form.district}, {form.state}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal-400">Growth Stage</span>
                  <span className="font-semibold text-charcoal-800">{form.growth_stage}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
