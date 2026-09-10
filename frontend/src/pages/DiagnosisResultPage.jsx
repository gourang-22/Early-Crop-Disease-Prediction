import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

const API = 'http://localhost:8000'

export default function DiagnosisResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeFarm } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { result, farm, imagePreview } = location.state || {}

  // If no result in state, redirect back to scanner
  useEffect(() => {
    if (!result) navigate('/disease', { replace: true })
  }, [result, navigate])

  if (!result) return null

  const activeCrop = farm?.crop || activeFarm?.crop || 'Tomato'
  const expectedCrop = result.expected_crop || activeCrop
  const plantIdentified = result.plant_identified
  const isPlantIdentified = Boolean(plantIdentified && plantIdentified.toLowerCase() !== 'null')
  const cropMatch = Boolean(result.crop_match)
  const disease = result.disease && result.disease.toLowerCase() !== 'null' ? result.disease : null

  const conf = (result.confidence || 0) * 100
  const displayConf = Math.round(conf)
  const riskLevel = (result.risk_level || 'UNKNOWN').toUpperCase()

  const riskBadgeCls =
    riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' :
    riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
    riskLevel === 'LOW' ? 'bg-green-100 text-green-700 border border-green-200' :
    'bg-gray-100 text-gray-700 border border-gray-200'

  const barColor =
    riskLevel === 'HIGH' ? 'bg-red-500' :
    riskLevel === 'MEDIUM' ? 'bg-yellow-500' :
    'bg-green-500'

  // Plant header titles
  let plantTitle = plantIdentified || 'Unable to Diagnose Image'
  let plantSubtext = ''

  if (!isPlantIdentified) {
    plantTitle = 'Unable to Diagnose Image'
    plantSubtext = 'No recognizable crop or leaf detected'
  } else if (!cropMatch) {
    plantSubtext = `Detected plant type (not ${expectedCrop})`
  } else {
    plantSubtext = `Active farm crop verified (${expectedCrop})`
  }

  const handleDiscussWithBot = () => {
    navigate('/assistant', {
      state: {
        disease: disease || 'Crop inquiry',
        plant_identified: plantIdentified,
        expected_crop: expectedCrop,
        crop_match: cropMatch,
        confidence: result.confidence,
        risk_level: riskLevel,
        growth_stage: farm?.growth_stage || activeFarm?.growth_stage,
        district: farm?.district || activeFarm?.district,
        crop: plantIdentified || activeCrop,
      }
    })
  }

  const saveCase = async () => {
    if (!cropMatch || !disease) return
    setSaving(true)
    try {
      await fetch(`${API}/cases/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_id: farm?.id || activeFarm?.id || null,
          village: farm?.village || activeFarm?.village || 'Village D',
          crop: expectedCrop,
          disease: disease,
          confidence: result.confidence,
          risk_level: riskLevel,
          status: 'Suspected',
        }),
      })
      setSaved(true)
    } catch (err) {
      console.error('Error saving case:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/disease')}
            className="w-10 h-10 rounded-xl bg-white border border-earth-200 flex items-center justify-center text-charcoal-600 hover:bg-earth-100 hover:border-forest-300 transition shadow-sm"
            title="Back to scanner"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-charcoal-800">Diagnosis Result</h1>
            <p className="text-xs text-charcoal-400">AI Analysis Complete</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/disease')}
          className="btn-secondary text-xs flex items-center gap-2 py-2 px-3.5 shadow-sm"
        >
          <svg className="w-4 h-4 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Scan Another Image
        </button>
      </div>

      {/* Main result card */}
      <div className="card p-6 md:p-8 space-y-6 shadow-sm border border-earth-200">
        {/* Identified plant header banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-earth-100">
          <div>
            <p className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest mb-0.5">
              IDENTIFIED PLANT
            </p>
            <h2 className={`text-2xl md:text-3xl font-bold ${!isPlantIdentified ? 'text-charcoal-700' : 'text-forest-900'}`}>
              {plantTitle}
            </h2>
            <p className="text-xs font-medium text-charcoal-500 mt-1">
              {plantSubtext}
            </p>
          </div>

          {isPlantIdentified ? (
            <span className="self-start sm:self-auto bg-green-100/80 text-green-800 border border-green-200 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span>🌱</span> PLANT IDENTIFIED
            </span>
          ) : (
            <span className="self-start sm:self-auto bg-amber-100 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span>⚠️</span> UNABLE TO DIAGNOSE
            </span>
          )}
        </div>

        {/* 2-Column visual breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Left Column: Image Preview */}
          <div className="rounded-2xl overflow-hidden border border-earth-200 bg-earth-50 min-h-[260px] max-h-[340px] flex items-center justify-center">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Uploaded crop"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-8">
                <span className="text-5xl mb-2 block">📷</span>
                <p className="text-xs text-charcoal-400 font-medium">Image preview not available</p>
              </div>
            )}
          </div>

          {/* Right Column: Diagnosis & Confidence */}
          {disease ? (
            <div className="rounded-2xl border border-red-100 bg-red-50/20 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Likely Disease & Risk Header */}
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-widest">
                    LIKELY DISEASE
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${riskBadgeCls}`}>
                    {riskLevel} RISK
                  </span>
                </div>

                {/* Disease Name */}
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl mt-0.5">🌱</span>
                  <div>
                    <h3 className="text-2xl font-bold text-charcoal-900 leading-tight">
                      {disease}
                    </h3>
                    <p className="text-xs text-charcoal-500 mt-0.5">
                      in {plantIdentified || expectedCrop}
                    </p>
                  </div>
                </div>

                {/* AI Assessment Confidence Meter */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-charcoal-600 uppercase tracking-wider">
                    <span>AI ASSESSMENT CONFIDENCE</span>
                    <span className="text-xl font-extrabold text-red-600">{displayConf}%</span>
                  </div>
                  <div className="w-full bg-earth-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${displayConf}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Assessment Disclaimer Note */}
              <div className="bg-red-50 border border-red-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-800">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">!</span>
                <p className="leading-relaxed">
                  <strong>Note:</strong> This is an AI-based assessment. Please confirm with a local agriculture expert.
                </p>
              </div>
            </div>
          ) : (
            /* Non-plant / Unidentifiable Case */
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shadow-inner">
                📷
              </div>
              <h3 className="text-lg font-bold text-charcoal-800">Clear Crop Leaf Required</h3>
              <p className="text-xs text-charcoal-600 max-w-xs leading-relaxed">
                The AI could not identify a valid agricultural plant in this photo. For an accurate diagnosis, please photograph a single affected leaf under good lighting.
              </p>
            </div>
          )}
        </div>

        {/* About This Result section */}
        <div className="space-y-3 pt-1">
          <h3 className="font-bold text-charcoal-800 text-base">About This Result</h3>
          <p className="text-sm text-charcoal-600 leading-relaxed">
            {result.message}
          </p>

          {/* CASE 2: Crop Mismatch Banner (Matches screenshot) */}
          {isPlantIdentified && !cropMatch && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3 text-blue-900">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                i
              </div>
              <p className="text-xs leading-relaxed">
                <strong>This image does not appear to be a {expectedCrop} plant.</strong> Please ensure you upload the correct crop image for the most accurate diagnosis.
              </p>
            </div>
          )}

          {/* Uncertainty banner if flagged */}
          {result.is_uncertain && isPlantIdentified && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2.5 text-amber-900 text-xs">
              <span className="text-sm">⚠️</span>
              <p className="leading-relaxed">
                <strong>Low certainty assessment:</strong> The visual symptoms on this leaf appear ambiguous or partially obscured. An in-person inspection is strongly recommended.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons Row (3 Columns matching screenshot) */}
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Button 1: Discuss with KrishiBot */}
          <button
            onClick={handleDiscussWithBot}
            className="bg-forest-800 hover:bg-forest-700 text-white rounded-xl p-3.5 flex items-center gap-3 transition shadow-sm text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-forest-700 group-hover:bg-forest-600 flex items-center justify-center text-lg flex-shrink-0 transition">
              💬
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug">Discuss with KrishiBot</p>
              <p className="text-[11px] text-forest-200 leading-tight truncate">Ask questions about this disease</p>
            </div>
          </button>

          {/* Button 2: Save Case or Scan Correct Crop */}
          {cropMatch && disease ? (
            <button
              onClick={saveCase}
              disabled={saving || saved}
              className="bg-white hover:bg-earth-50 border border-earth-200 hover:border-forest-300 rounded-xl p-3.5 flex items-center justify-center gap-2 text-sm font-bold text-charcoal-700 transition shadow-sm disabled:opacity-60"
            >
              <span className="text-base">💾</span>
              <span>{saved ? 'Case Saved for Officer' : saving ? 'Saving...' : 'Save Case for Officer Review'}</span>
            </button>
          ) : !cropMatch ? (
            <button
              onClick={() => navigate('/disease')}
              className="bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl p-3.5 flex items-center justify-center gap-2 text-sm font-bold text-amber-900 transition shadow-sm"
              title={`Upload an image of your active ${expectedCrop} crop`}
            >
              <span className="text-base">📸</span>
              <span>Scan Correct Crop</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/disease')}
              className="bg-white hover:bg-earth-50 border border-earth-200 rounded-xl p-3.5 flex items-center justify-center gap-2 text-sm font-bold text-charcoal-700 transition shadow-sm"
            >
              <span className="text-base">📸</span>
              <span>Retake Photo</span>
            </button>
          )}

          {/* Button 3: Scan Another Image */}
          <button
            onClick={() => navigate('/disease')}
            className="bg-white hover:bg-earth-50 border border-earth-200 hover:border-forest-300 rounded-xl p-3.5 flex items-center justify-center gap-2 text-sm font-bold text-charcoal-700 transition shadow-sm"
          >
            <span className="text-base">🔄</span>
            <span>Scan Another Image</span>
          </button>
        </div>
      </div>
    </div>
  )
}
