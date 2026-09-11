import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@/api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh')
    setToken(null)
    setUser(null)
  }, [])

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/profile/')
      setUser(data)
      return data
    } catch (err) {
      clearAuth()
      return null
    }
  }, [clearAuth])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const { data } = await api.get('/auth/profile/')
        if (!cancelled) setUser(data)
      } catch {
        if (!cancelled) clearAuth()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [token, clearAuth])

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password })
    localStorage.setItem('token', data.access)
    if (data.refresh) localStorage.setItem('refresh', data.refresh)
    setToken(data.access)
    setUser(data.user ?? null)
    if (!data.user) await fetchUser()
    return data
  }, [fetchUser])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register/', payload)
    localStorage.setItem('token', data.access)
    if (data.refresh) localStorage.setItem('refresh', data.refresh)
    setToken(data.access)
    setUser(data.user ?? null)
    return data
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh')
    try {
      if (refresh) await api.post('/auth/logout/', { refresh })
    } catch {
      // silent — clear local state regardless
    } finally {
      clearAuth()
    }
  }, [clearAuth])

  const value = {
    token,
    user,
    loading,
    login,
    register,
    logout,
    refreshUser: fetchUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}