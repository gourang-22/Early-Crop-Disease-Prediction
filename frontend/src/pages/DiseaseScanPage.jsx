import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:8000'

export default function DiseaseScanPage() {
  const { activeFarm } = useAuth()
  const navigate = useNavigate()
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleImageChange = (e) => handleFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleScan = async () => {
    if (!image) return
    setLoading(true)

    const formData = new FormData()
    formData.append('file', image)
    if (activeFarm?.crop) formData.append('crop', activeFarm.crop)
    if (activeFarm?.district) formData.append('district', activeFarm.district)
    if (activeFarm?.growth_stage) formData.append('growth_stage', activeFarm.growth_stage)

    try {
      const response = await fetch(`${API}/predict/disease`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      // Navigate to result page with state
      navigate('/disease/result', {
        state: {
          result: data,
          farm: activeFarm,
          imagePreview: preview,
        }
      })
    } catch (error) {
      console.error('Error scanning image:', error)
      alert('Error scanning image. Make sure the AI service is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setImage(null)
    setPreview(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal-800">Disease Scanner</h1>
        <p className="text-charcoal-400 text-sm mt-0.5">
          Upload a clear photo of affected leaves or crop damage for AI analysis.
          {activeFarm && <span className="ml-1 font-medium text-forest-600">Scanning: {activeFarm.crop}</span>}
        </p>
      </div>

      {/* Upload card */}
      <div className="card p-6 space-y-5">

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-700 mb-2">📸 Photo Tips for Best Assessment</p>
          <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
            <li>Focus on a single affected leaf in good natural light</li>
            <li>Keep the photo sharp — avoid blurry or dark images</li>
            <li>Capture both the lesion pattern and surrounding healthy tissue</li>
          </ul>
        </div>

        {/* Upload area */}
        {!preview ? (
          <label
            className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition ${
              dragOver
                ? 'border-forest-500 bg-forest-50'
                : 'border-earth-300 bg-earth-50 hover:bg-earth-100 hover:border-forest-300'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <span className="text-4xl mb-3">{dragOver ? '📂' : '📷'}</span>
            <p className="text-sm font-semibold text-charcoal-700 mb-1">
              {dragOver ? 'Drop your photo here' : 'Click or drag & drop a photo'}
            </p>
            <p className="text-xs text-charcoal-400">JPG, PNG, WebP supported · Max 10MB</p>
            <input
              id="disease-upload"
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-earth-200">
              <img
                src={preview}
                alt="Crop photo preview"
                className="w-full h-64 object-cover"
              />
              <button
                onClick={clear}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center text-lg hover:bg-black/70 transition"
              >
                ×
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clear}
                className="btn-secondary flex-shrink-0"
              >
                Change Photo
              </button>
              <button
                onClick={handleScan}
                disabled={loading}
                className="btn-primary flex-1 justify-center"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Analyzing with AI...
                  </span>
                ) : (
                  <span>🔬 Analyze Image</span>
                )}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-forest-50 border border-forest-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                🧠
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-forest-800">AI is analyzing your crop photo</p>
                <p className="text-xs text-forest-600 mt-0.5">Running disease classification model... This usually takes 2-5 seconds.</p>
                <div className="mt-2 h-1.5 bg-forest-100 rounded-full overflow-hidden">
                  <div className="h-full bg-forest-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-charcoal-700 mb-3">How It Works</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: '1', icon: '📸', title: 'Upload', desc: 'Take a clear photo of affected plant parts' },
            { step: '2', icon: '🧠', title: 'AI Scan', desc: 'AI analyzes symptoms and provides an assessment confidence' },
            { step: '3', icon: '💊', title: 'Guidance', desc: 'Get management recommendations or escalate to expert' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-8 h-8 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center mx-auto mb-2 text-xs font-bold text-forest-700">{s.step}</div>
              <p className="text-lg mb-1">{s.icon}</p>
              <p className="text-xs font-bold text-charcoal-700">{s.title}</p>
              <p className="text-[10px] text-charcoal-400 mt-0.5 leading-tight">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
