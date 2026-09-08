import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageLoader({ children }) {
  const [loading, setLoading] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const location = useLocation()

  useEffect(() => {
    setLoading(true)
    const t1 = setTimeout(() => {
      setDisplayChildren(children)
    }, 1000)
    const t2 = setTimeout(() => {
      setLoading(false)
    }, 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [location.pathname])

  return (
    <>
      {/* Always show current page content */}
      <div style={{ visibility: loading ? 'hidden' : 'visible' }}>
        {displayChildren}
      </div>

      {/* Full screen loader on top */}
      {loading && (
        <div className="fixed inset-0 z-[9999] overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #2d1a0a 0%, #4a2f0d 30%, #6b4510 60%, #8B6535 80%, #a07840 100%)',
          }}
        >
          {/* Soil texture layer */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(ellipse at 20% 50%, #c8a06a 1px, transparent 1px),
                                radial-gradient(ellipse at 80% 30%, #c8a06a 1px, transparent 1px),
                                radial-gradient(ellipse at 60% 70%, #c8a06a 1px, transparent 1px),
                                radial-gradient(ellipse at 40% 20%, #c8a06a 1px, transparent 1px)`,
              backgroundSize: '120px 120px',
            }}
          />

          {/* Rocks / pebbles scattered */}
          <div className="absolute inset-0 flex items-center">
            {['🪨','🪨','🌿','🪨','🌱','🪨','🌿','🪨','🌱','🪨'].map((e, i) => (
              <span
                key={i}
                className="absolute text-2xl opacity-60"
                style={{
                  left: `${5 + i * 10}%`,
                  top: `${35 + (i % 3) * 12}%`,
                  transform: `rotate(${i * 23}deg)`,
                }}
              >
                {e}
              </span>
            ))}
          </div>

          {/* Soil cracks */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <line x1="10%" y1="30%" x2="25%" y2="55%" stroke="#c8a06a" strokeWidth="2"/>
            <line x1="25%" y1="55%" x2="20%" y2="75%" stroke="#c8a06a" strokeWidth="1.5"/>
            <line x1="60%" y1="20%" x2="75%" y2="50%" stroke="#c8a06a" strokeWidth="2"/>
            <line x1="75%" y1="50%" x2="85%" y2="65%" stroke="#c8a06a" strokeWidth="1.5"/>
            <line x1="40%" y1="60%" x2="55%" y2="80%" stroke="#c8a06a" strokeWidth="1.5"/>
          </svg>

          {/* KrishiScan watermark */}
          <div className="absolute top-8 left-0 right-0 flex justify-center">
            <span className="text-earth-300 text-sm font-semibold tracking-widest uppercase opacity-60">
              🌱 KrishiScan
            </span>
          </div>

          {/* The insect running */}
          <div
            className="absolute top-1/2 -translate-y-1/2 text-6xl"
            style={{ animation: 'bugRun 1s cubic-bezier(0.4, 0, 0.4, 1) forwards' }}
          >
            🐛
          </div>

          {/* Dirt trail */}
          <div
            className="absolute top-1/2 h-2 rounded-full opacity-70"
            style={{
              background: 'linear-gradient(to right, transparent, #2d1a0a)',
              animation: 'trailGrow 1s ease forwards',
              transform: 'translateY(20px)',
            }}
          />

          {/* Loading text */}
          <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-earth-300 opacity-70"
                  style={{ animation: `bounce 0.6s ease infinite`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-earth-300 text-xs tracking-widest uppercase opacity-60">Loading</p>
          </div>

          <style>{`
            @keyframes bugRun {
              0%   { left: -80px; }
              100% { left: calc(100% + 80px); }
            }
            @keyframes trailGrow {
              0%   { left: 0; width: 0; }
              100% { left: 0; width: 100%; }
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50%       { transform: translateY(-6px); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}