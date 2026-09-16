import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GROWTH_STAGES = ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest-ready']
const CROPS = ['Tomato', 'Cotton', 'Wheat', 'Rice', 'Soybean', 'Onion', 'Sugarcane', 'Maize', 'Chickpea', 'Other']
const STATES = ['Maharashtra', 'Punjab', 'Haryana', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Rajasthan', 'Madhya Pradesh', 'West Bengal']

function FarmCard({ farm, isActive, onSelect, onEdit, onDelete }) {
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
        <Link
          to="/disease"
          onClick={e => e.stopPropagation()}
          className="text-xs text-forest-600 hover:text-forest-500 font-semibold"
        >
          Scan Crop →
        </Link>
        <div className="flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); onEdit(farm) }}
            className="text-xs text-charcoal-500 hover:text-charcoal-700 bg-earth-50 hover:bg-earth-100 border border-earth-200 px-2.5 py-1 rounded-lg transition font-medium"
          >
            ✏️ Edit
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(farm) }}
            className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition font-medium"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

function FarmFormModal({ farm, title, onClose, onSubmit }) {
  const [form, setForm] = useState(farm || {
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
      await onSubmit(form)
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
          <h2 className="text-xl font-bold text-charcoal-800">{title}</h2>
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

          {/* GPS Pin for Stationary Farm */}
          <div className="bg-earth-50 border border-earth-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-charcoal-700">Stationary Farm Pin</p>
                <p className="text-[11px] text-charcoal-400">
                  {form.latitude && form.longitude
                    ? `📍 Coords: ${form.latitude.toFixed(4)}°, ${form.longitude.toFixed(4)}°`
                    : 'Weather auto-fetches for district if pin not set'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) return alert('GPS not supported')
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setForm({ ...form, latitude: pos.coords.latitude, longitude: pos.coords.longitude })
                  })
                }}
                className="text-xs bg-white border border-earth-300 hover:border-forest-400 text-forest-700 font-semibold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
              >
                <span>📍</span> {form.latitude ? 'Re-detect Pin' : 'Detect GPS Pin'}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : 'Save Farm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ farm, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box p-8 max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="text-5xl mb-4">🗑️</div>
          <h2 className="text-xl font-bold text-charcoal-800 mb-2">Delete Farm?</h2>
          <p className="text-charcoal-500 text-sm mb-6">
            Are you sure you want to delete <strong>{farm.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleConfirm} disabled={loading} className="btn-danger flex-1 justify-center">
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FarmsPage() {
  const { farms, activeFarm, selectFarm, addFarm, updateFarm, deleteFarm } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editFarm, setEditFarm] = useState(null)
  const [deletingFarm, setDeletingFarm] = useState(null)

  const handleEdit = async (formData) => {
    await updateFarm(editFarm.id, formData)
    setEditFarm(null)
  }

  const handleDelete = async () => {
    await deleteFarm(deletingFarm.id)
    setDeletingFarm(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-800">My Farms</h1>
          <p className="text-charcoal-400 text-sm mt-0.5">{farms.length} farm{farms.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          + Add Farm
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">🌾</div>
          <h3 className="text-lg font-bold text-charcoal-700 mb-2">No farms yet</h3>
          <p className="text-charcoal-400 text-sm mb-6">Add your first farm to start monitoring.</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">Add Farm</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {farms.map(farm => (
            <FarmCard
              key={farm.id}
              farm={farm}
              isActive={activeFarm?.id === farm.id}
              onSelect={() => selectFarm(farm)}
              onEdit={setEditFarm}
              onDelete={setDeletingFarm}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <FarmFormModal
          title="Add New Farm"
          onClose={() => setShowAddModal(false)}
          onSubmit={addFarm}
        />
      )}
      {editFarm && (
        <FarmFormModal
          title="Edit Farm"
          farm={editFarm}
          onClose={() => setEditFarm(null)}
          onSubmit={handleEdit}
        />
      )}
      {deletingFarm && (
        <DeleteConfirmModal
          farm={deletingFarm}
          onClose={() => setDeletingFarm(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
