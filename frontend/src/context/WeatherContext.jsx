import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { API } from '../services/api'

const WeatherContext = createContext(null)

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export function WeatherProvider({ children }) {
  const [weatherData, setWeatherData] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState(null)
  const fetchingRef = useRef(false)

  const fetchWeather = useCallback(async (lat, lon, city, crop, growthStage) => {
    if (!lat && !lon && !city) return
    if (fetchingRef.current) return
    fetchingRef.current = true
    setWeatherLoading(true)
    setWeatherError(null)

    try {
      const params = new URLSearchParams()
      if (lat !== null && lat !== undefined) params.append('lat', lat.toString())
      if (lon !== null && lon !== undefined) params.append('lon', lon.toString())
      if (city) params.append('city', city)
      if (crop) params.append('crop', crop)
      if (growthStage) params.append('growth_stage', growthStage)

      const res = await fetch(`${API}/weather/?${params}`)
      if (!res.ok) throw new Error(`Weather API error: ${res.status}`)
      const data = await res.json()
      setWeatherData(data)

      // Cache with timestamp
      localStorage.setItem('krishi_weather_cache', JSON.stringify({
        data,
        timestamp: Date.now(),
        lat: lat || data.latitude,
        lon: lon || data.longitude,
        city: city || data.city,
      }))
    } catch (err) {
      console.error('Weather fetch failed:', err)
      setWeatherError(err.message)
    } finally {
      setWeatherLoading(false)
      fetchingRef.current = false
    }
  }, [])

  const loadFromCacheOrFetch = useCallback((lat, lon, city, crop, growthStage) => {
    if (!lat && !lon && !city) return
    try {
      const cached = JSON.parse(localStorage.getItem('krishi_weather_cache') || 'null')
      if (
        cached &&
        Date.now() - cached.timestamp < CACHE_TTL_MS &&
        ((lat && lon && Math.abs(cached.lat - lat) < 0.01 && Math.abs(cached.lon - lon) < 0.01) ||
         (city && cached.city === city))
      ) {
        setWeatherData(cached.data)
        return
      }
    } catch (_) {}
    fetchWeather(lat, lon, city, crop, growthStage)
  }, [fetchWeather])

  const refreshWeather = useCallback((lat, lon, city, crop, growthStage) => {
    localStorage.removeItem('krishi_weather_cache')
    fetchWeather(lat, lon, city, crop, growthStage)
  }, [fetchWeather])

  return (
    <WeatherContext.Provider value={{
      weatherData,
      weatherLoading,
      weatherError,
      fetchWeather: loadFromCacheOrFetch,
      refreshWeather,
    }}>
      {children}
    </WeatherContext.Provider>
  )
}

export const useWeather = () => {
  const ctx = useContext(WeatherContext)
  if (!ctx) throw new Error('useWeather must be used within WeatherProvider')
  return ctx
}

export default WeatherContext
