import { useState, useRef } from 'react'

const INSECT_INFO = {
  Beneficial: {
    emoji: '🌿',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800 border-green-200',
    title: 'Beneficial Insect',
    desc: 'This insect is good for your farm!',
  },
  Harmful: {
    emoji: '⚠️',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800 border-red-200',
    title: 'Harmful Pest',
    desc: 'This insect can damage your crops.',
  },
  Neutral: {
    emoji: '🔍',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    title: 'Neutral Insect',
    desc: 'Monitor population levels on your farm.',
  },
}

export default function InsectScanPage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleSubmit() {
    if (!image) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', image)

      const res = await fetch('http://localhost:8000/predict/insect', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Prediction failed')
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError('Detection failed. Make sure AI service is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setImage(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  const info = result ? INSECT_INFO[result.insect_type] : null

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-forest-800">Insect Detection</h2>
        <p className="text-gray-500 text-sm mt-1">
          Upload a photo of an insect to identify if it is beneficial or harmful to your crops
        </p>
      </div>

      {/* Upload area — hide after result */}
      {!result && (
        <>
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-green-500 bg-green-50 scale-[1.01]'
                : preview
                ? 'border-forest-300 bg-forest-50'
                : 'border-gray-300 bg-white hover:border-forest-400 hover:bg-gray-50'
            }`}
          >
            {preview ? (
              <div className="p-4">
                <img
                  src={preview}
                  alt="preview"
                  className="w-full max-h-72 object-cover rounded-xl"
                />
                <p className="text-center text-xs text-forest-600 mt-3 font-medium">
                  ✓ Image ready — click to change
                </p>
              </div>
            ) : (
              <div className="py-16 px-8 text-center">
                <div className="text-5xl mb-4">🐛</div>
                <p className="text-gray-700 font-medium">Drag and drop insect image here</p>
                <p className="text-gray-400 text-sm mt-1">or click to browse</p>
                <p className="text-gray-300 text-xs mt-4">Supports JPG, PNG, WEBP</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {/* Tips */}
          {!preview && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: '🔍', tip: 'Clear close-up' },
                { icon: '☀️', tip: 'Good lighting' },
                { icon: '🎯', tip: 'Single insect' },
              ].map(({ icon, tip }) => (
                <div key={tip} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-lg mb-1">{icon}</div>
                  <p className="text-xs text-gray-500">{tip}</p>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!image || loading}
            className="mt-6 w-full bg-forest-700 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-forest-600 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Analysing insect...
              </>
            ) : (
              'Detect Insect →'
            )}
          </button>
        </>
      )}

      {/* Result */}
      {result && info && (
        <div className="space-y-4">
          {/* Image + classification */}
          <div className={`rounded-2xl border p-5 ${info.bg} ${info.border}`}>
            <div className="flex gap-4">
              {preview && (
                <img
                  src={preview}
                  alt="scanned"
                  className="w-24 h-24 object-cover rounded-xl flex-shrink-0 border border-white shadow"
                />
              )}
              <div className="flex-1">
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border mb-2 ${info.badge}`}>
                  {info.emoji} {info.title}
                </span>
                <p className={`text-2xl font-bold ${info.color}`}>
                  {result.insect_type}
                </p>
                <p className="text-sm text-gray-500 mt-1">{info.desc}</p>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Confidence</span>
                <span className="font-semibold">{Math.round(result.confidence * 100)}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    result.insect_type === 'Beneficial' ? 'bg-green-500' :
                    result.insect_type === 'Harmful' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.round(result.confidence * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* All scores */}
          <div className="bg-white border border-earth-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Classification scores</p>
            <div className="space-y-2">
              {Object.entries(result.all_scores)
                .sort(([,a],[,b]) => b - a)
                .map(([cls, score]) => (
                  <div key={cls} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-20 flex-shrink-0">{cls}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          cls === 'Beneficial' ? 'bg-green-400' :
                          cls === 'Harmful' ? 'bg-red-400' : 'bg-yellow-400'
                        }`}
                        style={{ width: `${Math.round(score * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">
                      {Math.round(score * 100)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Impact */}
          <div className="bg-white border border-earth-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Farm impact</p>
            <p className="text-sm text-gray-700 leading-relaxed">🌾 {result.impact}</p>
          </div>

          {/* Management */}
          <div className="bg-white border border-earth-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Recommended action</p>
            <p className="text-sm text-gray-700 leading-relaxed">💡 {result.management}</p>
          </div>

          {/* Scan again */}
          <button
            onClick={handleReset}
            className="w-full py-3 bg-forest-700 text-white rounded-xl text-sm font-semibold hover:bg-forest-600 transition"
          >
            🔄 Scan Another Insect
          </button>
        </div>
      )}
    </div>
  )
}