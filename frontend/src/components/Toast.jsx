import { useState, useCallback } from 'react'

/**
 * useToast — returns { toasts, showToast }
 * showToast({ message, type: 'success'|'error'|'info', duration?: ms })
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback(({ message, type = 'success', duration = 3500 }) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  return { toasts, showToast }
}

const ICONS = { success: '✅', error: '❌', info: 'ℹ️' }

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
