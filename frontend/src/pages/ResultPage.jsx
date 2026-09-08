import { useNavigate } from 'react-router-dom'

const CROP_MAP = {
  'Alluvial_Soil':  ['Wheat', 'Rice', 'Sugarcane', 'Maize', 'Pulses'],
  'Black_Soil':     ['Cotton', 'Soybean', 'Sorghum', 'Groundnut', 'Sunflower'],
  'Red_Soil':       ['Groundnut', 'Millets', 'Tobacco', 'Potato', 'Ragi'],
  'Laterite_Soil':  ['Tea', 'Coffee', 'Rubber', 'Cashew', 'Tapioca'],
  'Arid_Soil':      ['Bajra', 'Jowar', 'Moth Bean', 'Cluster Bean', 'Sesame'],
  'Mountain_Soil':  ['Apple', 'Tea', 'Coffee', 'Barley', 'Potato'],
  'Yellow_Soil':    ['Rice', 'Maize', 'Groundnut', 'Potato', 'Vegetables'],
}

const HEALTH_MAP = {
  'Alluvial_Soil':  { phRange: '6.5–7.5', drainage: 'Good',      nutrients: 'High'     },
  'Black_Soil':     { phRange: '7.2–8.5', drainage: 'Poor',      nutrients: 'Moderate' },
  'Red_Soil':       { phRange: '6.0–7.0', drainage: 'Good',      nutrients: 'Low'      },
  'Laterite_Soil':  { phRange: '5.5–6.0', drainage: 'Excellent', nutrients: 'Low'      },
  'Arid_Soil':      { phRange: '7.5–8.5', drainage: 'Excellent', nutrients: 'Very Low' },
  'Mountain_Soil':  { phRange: '5.0–6.5', drainage: 'Good',      nutrients: 'Moderate' },
  'Yellow_Soil':    { phRange: '5.5–6.5', drainage: 'Moderate',  nutrients: 'Low'      },
}

export default function ResultPage() {
  const navigate = useNavigate()
  const raw  = sessionStorage.getItem('lastScan')
  const data = raw ? JSON.parse(raw) : null

  if (!data) return (
    <div className="max-w-2xl mx-auto py-10 text-center">
      <p className="text-gray-500 text-sm mb-4">No scan result found.</p>
      <button
        onClick={() => navigate('/scan')}
        className="bg-forest-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-forest-600 transition"
      >
        Go to Scan
      </button>
    </div>
  )

  const soilType  = data.soil_type
  const confidence = data.confidence
  const crops     = CROP_MAP[soilType]  || ['Consult local agronomist']
  const health    = HEALTH_MAP[soilType] || { phRange: 'N/A', drainage: 'N/A', nutrients: 'N/A' }
  const allScores = data.all_scores || {}

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="text-2xl font-bold text-forest-800">Scan Result</h2>

      {/* Soil type */}
      <div className="bg-white border border-earth-100 rounded-2xl p-6 shadow-sm">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Soil type detected</p>
        <p className="text-3xl font-bold text-forest-700">
          {soilType?.replace('_', ' ')}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className="bg-forest-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.round(confidence * 100)}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-forest-700 flex-shrink-0">
            {Math.round(confidence * 100)}% confident
          </span>
        </div>
      </div>

      {/* All scores */}
      <div className="bg-white border border-earth-100 rounded-2xl p-6 shadow-sm">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">All soil scores</p>
        <div className="space-y-2">
          {Object.entries(allScores)
            .sort(([,a],[,b]) => b - a)
            .map(([cls, score]) => (
              <div key={cls} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-32 flex-shrink-0">
                  {cls.replace('_', ' ')}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-forest-400 h-1.5 rounded-full"
                    style={{ width: `${Math.round(score * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {Math.round(score * 100)}%
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Health */}
      <div className="bg-white border border-earth-100 rounded-2xl p-6 shadow-sm">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Soil health overview</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-earth-50 rounded-xl p-3">
            <p className="text-lg font-bold text-forest-800">{health.phRange}</p>
            <p className="text-xs text-gray-400 mt-1">pH Range</p>
          </div>
          <div className="bg-earth-50 rounded-xl p-3">
            <p className="text-lg font-bold text-forest-800">{health.drainage}</p>
            <p className="text-xs text-gray-400 mt-1">Drainage</p>
          </div>
          <div className="bg-earth-50 rounded-xl p-3">
            <p className="text-lg font-bold text-forest-800">{health.nutrients}</p>
            <p className="text-xs text-gray-400 mt-1">Nutrients</p>
          </div>
        </div>
      </div>

      {/* Crops */}
      <div className="bg-white border border-earth-100 rounded-2xl p-6 shadow-sm">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Recommended crops</p>
        <div className="flex flex-wrap gap-2">
          {crops.map(crop => (
            <span key={crop} className="bg-forest-50 text-forest-800 text-sm px-3 py-1.5 rounded-full border border-forest-200 font-medium">
              🌾 {crop}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/scan')}
          className="py-3 bg-white border border-earth-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-earth-50 transition"
        >
          🔄 Scan Again
        </button>
        <button
          onClick={() => navigate('/insect')}
          className="py-3 bg-forest-700 text-white rounded-xl text-sm font-medium hover:bg-forest-600 transition"
        >
          🐛 Check Insects
        </button>
      </div>
    </div>
  )
}