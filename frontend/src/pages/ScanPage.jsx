import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ScanPage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()
  const navigate = useNavigate()

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
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
    try {
      const formData = new FormData()
      formData.append('file', image)

      const res = await fetch('http://localhost:8000/predict/soil', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Prediction failed')
      const data = await res.json()

      // Store result and navigate
      sessionStorage.setItem('lastScan', JSON.stringify(data))
      navigate('/result/latest')
    } catch (err) {
      setError('Scan failed. Make sure AI service is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-forest-800">Scan your soil</h2>
        <p className="text-gray-500 text-sm mt-1">
          Upload a clear photo of your soil sample for AI analysis
        </p>
      </div>

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
            <div className="text-5xl mb-4">🪨</div>
            <p className="text-gray-700 font-medium">Drag and drop your soil image here</p>
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

      {!preview && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { icon: '☀️', tip: 'Good lighting' },
            { icon: '📐', tip: 'Close up shot' },
            { icon: '🎯', tip: 'Clear focus' },
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
            Analysing your soil...
          </>
        ) : (
          'Analyse Soil →'
        )}
      </button>
    </div>
  )
}