import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-earth-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-forest-800">Farmer Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back. Here is your farm's status.</p>
        </div>
        <div className="text-right">
          <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded border border-yellow-200">
            PROTOTYPE DATA
          </span>
        </div>
      </div>

      {/* Farm Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-earth-100 shadow-sm md:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Farm Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">CROP</p>
              <p className="font-semibold text-gray-900">Tomato</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">LOCATION</p>
              <p className="font-semibold text-gray-900">Nashik, Maharashtra</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">STAGE</p>
              <p className="font-semibold text-gray-900">Flowering</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">AREA</p>
              <p className="font-semibold text-gray-900">2 Acres</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-earth-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Current Weather</h2>
          <div className="flex items-center gap-4">
            <span className="text-4xl">🌧️</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">24°C</p>
              <p className="text-sm text-gray-500">High Humidity (88%)</p>
              <p className="text-xs text-gray-400 mt-1">Recent rainfall detected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Alert */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-10 -mt-10 opacity-50"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-bold text-red-800">Early Warning: High Disease Risk</h2>
          </div>
          <p className="text-red-700 font-medium text-lg mb-1">
            Disease Risk: <span className="font-bold">82% (HIGH)</span>
          </p>
          <p className="text-red-600 text-sm max-w-2xl mb-6">
            Recent rainfall and high humidity have significantly increased the disease risk for your tomato crop. We recommend inspecting your field within the next 24-48 hours.
          </p>
          
          <div className="flex gap-4">
            <Link 
              to="/disease" 
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition shadow-md shadow-red-900/20"
            >
              📷 Inspect & Upload Photo
            </Link>
            <Link 
              to="/chat" 
              className="bg-white text-red-700 border border-red-200 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
            >
              💬 Ask AI Assistant
            </Link>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/scan" className="bg-white p-5 rounded-2xl border border-earth-100 shadow-sm hover:border-forest-300 transition flex items-center gap-4">
          <span className="text-3xl">🪨</span>
          <div>
            <h3 className="font-bold text-gray-800">Soil Scan</h3>
            <p className="text-xs text-gray-500">Identify soil type & crops</p>
          </div>
        </Link>
        <Link to="/insect" className="bg-white p-5 rounded-2xl border border-earth-100 shadow-sm hover:border-forest-300 transition flex items-center gap-4">
          <span className="text-3xl">🐛</span>
          <div>
            <h3 className="font-bold text-gray-800">Insect Scan</h3>
            <p className="text-xs text-gray-500">Beneficial or Harmful?</p>
          </div>
        </Link>
        <Link to="/weather" className="bg-white p-5 rounded-2xl border border-earth-100 shadow-sm hover:border-forest-300 transition flex items-center gap-4">
          <span className="text-3xl">🌦️</span>
          <div>
            <h3 className="font-bold text-gray-800">Weather Forecast</h3>
            <p className="text-xs text-gray-500">Detailed 7-day forecast</p>
          </div>
        </Link>
      </div>
    </div>
  )
}