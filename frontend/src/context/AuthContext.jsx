import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [farms, setFarms] = useState([])
  const [activeFarm, setActiveFarm] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('krishi_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
      } catch {
        localStorage.removeItem('krishi_user')
      }
    }
    setLoading(false)
  }, [])

  // Fetch farms whenever user changes
  const fetchFarms = useCallback(async (userId) => {
    if (!userId) return
    try {
      const res = await fetch(`${API}/farms/?owner_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setFarms(data)
        if (data.length > 0) {
          const savedFarmId = localStorage.getItem('krishi_active_farm')
          const found = savedFarmId ? data.find(f => f.id === parseInt(savedFarmId)) : null
          setActiveFarm(found || data[0])
        }
      }
    } catch (err) {
      console.error('Error fetching farms:', err)
    }
  }, [])

  useEffect(() => {
    if (user?.id) fetchFarms(user.id)
  }, [user, fetchFarms])

  const login = async (phone, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Login failed')
    }
    const data = await res.json()
    setUser(data)
    localStorage.setItem('krishi_user', JSON.stringify(data))
    return data
  }

  const register = async ({ name, phone, location, language, password }) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, location, language, password }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Registration failed')
    }
    const data = await res.json()
    setUser(data)
    localStorage.setItem('krishi_user', JSON.stringify(data))
    return data
  }

  const logout = () => {
    setUser(null)
    setFarms([])
    setActiveFarm(null)
    localStorage.removeItem('krishi_user')
    localStorage.removeItem('krishi_active_farm')
    localStorage.removeItem('krishi_weather_cache')
  }

  const addFarm = async (farmData) => {
    const res = await fetch(`${API}/farms/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...farmData, owner_id: user.id }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create farm' }))
      const msg = typeof err.detail === 'string' ? err.detail : (Array.isArray(err.detail) ? err.detail.map(e => e.msg).join(', ') : 'Failed to create farm')
      throw new Error(msg)
    }
    const newFarm = await res.json()
    setFarms(prev => [...prev, newFarm])
    setActiveFarm(newFarm)
    localStorage.setItem('krishi_active_farm', String(newFarm.id))
    return newFarm
  }

  const updateFarm = async (farmId, farmData) => {
    const res = await fetch(`${API}/farms/${farmId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(farmData),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update farm' }))
      const msg = typeof err.detail === 'string' ? err.detail : (Array.isArray(err.detail) ? err.detail.map(e => e.msg).join(', ') : 'Failed to update farm')
      throw new Error(msg)
    }
    const updated = await res.json()
    setFarms(prev => prev.map(f => f.id === farmId ? updated : f))
    if (activeFarm?.id === farmId) setActiveFarm(updated)
    return updated
  }

  const deleteFarm = async (farmId) => {
    const res = await fetch(`${API}/farms/${farmId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete farm')
    const remaining = farms.filter(f => f.id !== farmId)
    setFarms(remaining)
    if (activeFarm?.id === farmId) {
      const next = remaining[0] || null
      setActiveFarm(next)
      if (next) localStorage.setItem('krishi_active_farm', String(next.id))
      else localStorage.removeItem('krishi_active_farm')
    }
  }

  const selectFarm = (farm) => {
    setActiveFarm(farm)
    localStorage.setItem('krishi_active_farm', String(farm.id))
  }

  const refreshFarms = () => user?.id && fetchFarms(user.id)

  // ── Profile update ────────────────────────────────────────────────────────
  const updateProfile = async (profileData) => {
    const res = await fetch(`${API}/auth/profile?user_id=${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Failed to update profile')
    }
    const updated = await res.json()
    setUser(updated)
    localStorage.setItem('krishi_user', JSON.stringify(updated))
    // Clear weather cache so next fetch uses new location
    if (profileData.latitude || profileData.longitude) {
      localStorage.removeItem('krishi_weather_cache')
    }
    return updated
  }

  // ── Password change ───────────────────────────────────────────────────────
  const changePassword = async (oldPassword, newPassword) => {
    const res = await fetch(`${API}/auth/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        old_password: oldPassword,
        new_password: newPassword,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Failed to change password')
    }
    return true
  }

  return (
    <AuthContext.Provider value={{
      user,
      farms,
      activeFarm,
      loading,
      login,
      register,
      logout,
      addFarm,
      updateFarm,
      deleteFarm,
      selectFarm,
      refreshFarms,
      updateProfile,
      changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
