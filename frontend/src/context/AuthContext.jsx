import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      fetchUser()
    } else {
      localStorage.removeItem('token')
      setUser(null)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/profile/')
      setUser(res.data)
    } catch (err) {
      console.error('Fetch user error:', err)
      logout()
    }
  }

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login/', { username, password })
      const accessToken = res.data.access
      setToken(accessToken)
      return res.data
    } catch (err) {
      console.error('Login error:', err)
      throw err
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
