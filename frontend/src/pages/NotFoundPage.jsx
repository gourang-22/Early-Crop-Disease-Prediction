import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-earth-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🌿</div>
        <h1 className="text-6xl font-black text-forest-700 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-charcoal-800 mb-3">Page not found</h2>
        <p className="text-charcoal-400 text-sm mb-8 leading-relaxed">
          Looks like this field hasn't been planted yet. The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/dashboard" className="btn-primary">
            🏠 Go to Dashboard
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary">
            ← Go Back
          </button>
        </div>
        <p className="text-xs text-charcoal-300 mt-8">KrishiScan · Crop Intelligence Platform</p>
      </div>
    </div>
  )
}
