import axios from 'axios'

// Base URL for all API calls — used directly with fetch() throughout the app
export const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

// Axios instance — baseURL correctly points to the backend root (no /api prefix)
const api = axios.create({
  baseURL: API,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const saved = localStorage.getItem('krishi_user')
  if (saved) {
    try {
      const user = JSON.parse(saved)
      if (user?.id) config.headers['X-User-Id'] = user.id
    } catch (_) {}
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('krishi_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api