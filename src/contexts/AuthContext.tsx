import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AUTH_KEY = 'aitrading_auth'

export type AuthUser = {
  id: string
  email: string
  name: string | null
  role?: string   // admin | lid
  status?: string // admin | onboarding | active
  invoicePaid?: boolean // false = alleen Dashboard en Facturen klikbaar
}

type AuthContextType = {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  userEmail: string | null
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function loadStored(): { token: string; user: AuthUser } | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY)
    if (!stored) return null
    const data = JSON.parse(stored)
    if (data?.token && data?.user?.email) return { token: data.token, user: data.user }
    return null
  } catch {
    return null
  }
}

function saveStored(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const restoreSession = useCallback(async () => {
    const stored = loadStored()
    if (!stored) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${stored.token}` },
      })
      const text = await res.text()
      let json: { success?: boolean; data?: { user?: AuthUser } } = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        localStorage.removeItem(AUTH_KEY)
        setUser(null)
        setLoading(false)
        return
      }
      if (json.success && json.data?.user) {
        const u = json.data.user
        const normalized: AuthUser = {
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          role: typeof u.role === 'string' ? u.role : 'lid',
          status: typeof u.status === 'string' ? u.status : 'onboarding',
          invoicePaid: typeof u.invoicePaid === 'boolean' ? u.invoicePaid : true,
        }
        setUser(normalized)
        saveStored(stored.token, normalized)
      } else {
        localStorage.removeItem(AUTH_KEY)
        setUser(null)
      }
    } catch {
      localStorage.removeItem(AUTH_KEY)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  const login = useCallback(async (email: string, password: string) => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !password) return { success: false, error: 'Vul e-mail en wachtwoord in.' }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, password }),
      })
      const text = await res.text()
      let json: { success?: boolean; data?: { token?: string; user?: AuthUser }; error?: string } = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        return {
          success: false,
          error: 'Server gaf geen geldig antwoord. Draait de backend? (npm run server:dev of node server.js op poort 3001)',
        }
      }
      if (json.success && json.data?.token && json.data?.user) {
        const u = json.data.user
        const normalized: AuthUser = {
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          role: typeof u.role === 'string' ? u.role : 'lid',
          status: typeof u.status === 'string' ? u.status : 'onboarding',
          invoicePaid: typeof u.invoicePaid === 'boolean' ? u.invoicePaid : true,
        }
        saveStored(json.data.token, normalized)
        setUser(normalized)
        return { success: true }
      }
      return {
        success: false,
        error: json.error || 'Inloggen mislukt. Controleer je gegevens.',
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Netwerkfout. Probeer het opnieuw.',
      }
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !password) return { success: false, error: 'Vul e-mail en wachtwoord in.' }
    if (password.length < 6) return { success: false, error: 'Wachtwoord minimaal 6 tekens.' }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, password, name: name?.trim() || undefined }),
      })
      const text = await res.text()
      let json: { success?: boolean; data?: { token?: string; user?: AuthUser }; error?: string } = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        return { success: false, error: 'Server gaf geen geldig antwoord. Draait de backend op poort 3001?' }
      }
      if (json.success && json.data?.token && json.data?.user) {
        const u = json.data.user
        const normalized: AuthUser = {
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          role: typeof u.role === 'string' ? u.role : 'lid',
          status: typeof u.status === 'string' ? u.status : 'onboarding',
          invoicePaid: typeof u.invoicePaid === 'boolean' ? u.invoicePaid : true,
        }
        saveStored(json.data.token, normalized)
        setUser(normalized)
        return { success: true }
      }
      return { success: false, error: json.error || 'Registreren mislukt.' }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Netwerkfout.' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        login,
        register,
        logout,
        userEmail: user?.email ?? null,
        user,
        loading,
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
