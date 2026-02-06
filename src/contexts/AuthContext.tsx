import { createContext, useContext, useState, useCallback } from 'react'

const AUTH_KEY = 'aitrading_auth'

const ALLOWED_EMAIL = 'chiel@media2net.nl'
const ALLOWED_PASSWORD = 'W4t3rk0k3r^'

type AuthContextType = {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  userEmail: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      return stored ? JSON.parse(stored).email : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email: string, password: string) => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !password) return false
    if (trimmed !== ALLOWED_EMAIL || password !== ALLOWED_PASSWORD) return false
    setUserEmail(trimmed)
    localStorage.setItem(AUTH_KEY, JSON.stringify({ email: trimmed }))
    return true
  }, [])

  const logout = useCallback(() => {
    setUserEmail(null)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!userEmail,
        login,
        logout,
        userEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
