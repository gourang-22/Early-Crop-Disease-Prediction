import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API = 'http://localhost:8000'

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
  }

  const addFarm = async (farmData) => {
    const res = await fetch(`${API}/farms/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...farmData, owner_id: user.id }),
    })
    if (!res.ok) throw new Error('Failed to create farm')
    const newFarm = await res.json()
    setFarms(prev => [...prev, newFarm])
    setActiveFarm(newFarm)
    localStorage.setItem('krishi_active_farm', String(newFarm.id))
    return newFarm
  }

  const selectFarm = (farm) => {
    setActiveFarm(farm)
    localStorage.setItem('krishi_active_farm', String(farm.id))
  }

  const refreshFarms = () => user?.id && fetchFarms(user.id)

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
      selectFarm,
      refreshFarms,
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
