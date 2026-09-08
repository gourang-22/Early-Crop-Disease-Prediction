import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GROWTH_STAGES = ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest-ready']
const CROPS = ['Tomato', 'Cotton', 'Wheat', 'Rice', 'Soybean', 'Onion', 'Sugarcane', 'Maize', 'Chickpea', 'Other']
const STATES = ['Maharashtra', 'Punjab', 'Haryana', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Rajasthan', 'Madhya Pradesh', 'West Bengal']

function FarmCard({ farm, isActive, onSelect }) {
  const stageColors = {
    Germination: 'bg-green-100 text-green-700',
    Seedling: 'bg-lime-100 text-lime-700',
    Vegetative: 'bg-forest-100 text-forest-700',
    Flowering: 'bg-yellow-100 text-yellow-700',
    Fruiting: 'bg-orange-100 text-orange-700',
    'Harvest-ready': 'bg-earth-100 text-earth-700',
  }
  const stageColor = stageColors[farm.growth_stage] || 'bg-gray-100 text-gray-700'

  return (
    <div
      className={`card card-hover border-2 p-6 cursor-pointer transition ${
        isActive ? 'border-forest-400 ring-2 ring-forest-100' : 'border-earth-100'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-charcoal-800 text-base">{farm.name}</h3>
          <p className="text-xs text-charcoal-400 mt-0.5">{farm.village ? `${farm.village}, ` : ''}{farm.district}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isActive && (
            <span className="text-xs bg-forest-600 text-white px-2.5 py-0.5 rounded-full font-semibold">Active</span>
          )}
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${stageColor}`}>
            {farm.growth_stage}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'CROP', val: farm.crop },
          { label: 'AREA', val: farm.area || '—' },
          { label: 'VARIETY', val: farm.crop_variety || '—' },
        ].map(item => (
          <div key={item.label}>
            <p className="text-[9px] font-bold text-charcoal-400 tracking-widest uppercase">{item.label}</p>
            <p className="text-sm font-semibold text-charcoal-700 mt-0.5 truncate">{item.val}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-600 font-semibold">High Risk Alert</span>
        </div>
        <Link
          to="/disease"
          onClick={e => e.stopPropagation()}
          className="text-xs text-forest-600 hover:text-forest-500 font-semibold"
        >
          Scan Crop →
        </Link>
      </div>
    </div>
  )
}

function AddFarmModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '', village: '', district: '', state: 'Maharashtra',
    crop: 'Tomato', crop_variety: '', sowing_date: '', growth_stage: 'Vegetative', area: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: typeof e === 'string' ? e : e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onAdd(form)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box p-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-charcoal-800">Add New Farm</h2>
          <button onClick={onClose} className="text-charcoal-400 hover:text-charcoal-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Farm Name</label>
            <input className="form-input" placeholder="e.g. My Cotton Farm" value={form.name} onChange={set('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Village</label>
              <input className="form-input" placeholder="Village name" value={form.village} onChange={set('village')} />
            </div>
            <div>
              <label className="form-label">District</label>
              <input className="form-input" placeholder="e.g. Nashik" value={form.district} onChange={set('district')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">State</label>
              <select className="form-input" value={form.state} onChange={set('state')}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Area</label>
              <input className="form-input" placeholder="e.g. 3 Acres" value={form.area} onChange={set('area')} />
            </div>
          </div>
          <div>
            <label className="form-label">Crop</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CROPS.map(c => (
                <button key={c} type="button" onClick={() => set('crop')(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${form.crop === c ? 'bg-forest-700 text-white border-forest-700' : 'bg-white text-charcoal-600 border-earth-200 hover:border-forest-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Variety (optional)</label>
              <input className="form-input" placeholder="e.g. Hybrid-123" value={form.crop_variety} onChange={set('crop_variety')} />
            </div>
            <div>
              <label className="form-label">Sowing Date</label>
              <input type="date" className="form-input" value={form.sowing_date} onChange={set('sowing_date')} />
            </div>
          </div>
          <div>
            <label className="form-label">Growth Stage</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {GROWTH_STAGES.map(s => (
                <button key={s} type="button" onClick={() => set('growth_stage')(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${form.growth_stage === s ? 'bg-sage-700 text-white border-sage-700' : 'bg-white text-charcoal-600 border-earth-200 hover:border-sage-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Adding...' : 'Add Farm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FarmsPage() {
  const { farms, activeFarm, selectFarm, addFarm } = useAuth()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800">My Farms</h1>
          <p className="text-charcoal-400 text-sm mt-0.5">{farms.length} farm{farms.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Add Farm
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">🌾</div>
          <h3 className="text-lg font-bold text-charcoal-700 mb-2">No farms yet</h3>
          <p className="text-charcoal-400 text-sm mb-6">Add your first farm to start monitoring.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Add Farm</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {farms.map(farm => (
            <FarmCard
              key={farm.id}
              farm={farm}
              isActive={activeFarm?.id === farm.id}
              onSelect={() => selectFarm(farm)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddFarmModal onClose={() => setShowModal(false)} onAdd={addFarm} />
      )}
    </div>
  )
}
