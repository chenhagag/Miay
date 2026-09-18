import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { get, post, setToken, removeToken, getToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const data = await get('/auth/me')
      setUser(data.user)
      setPartner(data.partner || null)
    } catch {
      removeToken()
      setUser(null)
      setPartner(null)
    }
  }, [])

  useEffect(() => {
    if (getToken()) {
      fetchMe().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  const login = async (email, password) => {
    const data = await post('/auth/login', { email, password })
    setToken(data.token)
    await fetchMe()
  }

  const setup = async (setupData) => {
    const data = await post('/auth/setup', setupData)
    setToken(data.token)
    await fetchMe()
  }

  const logout = () => {
    removeToken()
    setUser(null)
    setPartner(null)
  }

  return (
    <AuthContext.Provider value={{ user, partner, loading, login, setup, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
