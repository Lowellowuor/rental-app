import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

let isRefreshing = false
let refreshQueue = []

function flushQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  refreshQueue = []
}

function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (original.url?.includes('/auth/login/') || original.url?.includes('/auth/refresh/')) {
      return Promise.reject(error)
    }

    const refresh = localStorage.getItem('refresh')
    if (!refresh) {
      clearAuth()
      return Promise.reject(error)
    }

    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    isRefreshing = true

    try {
      const { data } = await axios.post(`${baseURL}/auth/refresh/`, { refresh })

      const newToken = data.access
      localStorage.setItem('token', newToken)
      if (data.refresh) localStorage.setItem('refresh', data.refresh)

      flushQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      clearAuth()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api