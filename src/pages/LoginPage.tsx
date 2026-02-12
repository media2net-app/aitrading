import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('Vul je e-mailadres in.')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Vul een geldig e-mailadres in.')
      return false
    }
    if (!password) {
      setError('Vul je wachtwoord in.')
      return false
    }
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn.')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const result = await login(email.trim(), password)
    if (result.success) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.error || 'Inloggen mislukt. Controleer je gegevens.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark-900 px-4">
      <div className="w-full max-w-md rounded-xl border border-dark-600 bg-dark-800 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-semibold text-white">
            AI Trading.software
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white">Mijn account</h1>
        <p className="mt-2 text-gray-400">
          Log in om toegang te krijgen tot je dashboard.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="naam@voorbeeld.nl"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Wachtwoord
            </label>
            <div className="mt-2 relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 pr-16 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 my-1 inline-flex items-center rounded-md px-2 text-xs font-medium text-gray-300 hover:bg-dark-600"
              >
                {showPassword ? 'Verberg' : 'Toon'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-accent py-3.5 font-semibold text-white transition hover:bg-accent-hover"
          >
            Inloggen
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Nog geen account?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Registreren
          </Link>
          {' · '}
          <Link to="/signup" className="text-accent hover:underline">
            Aanmelden voor AI Trading
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-white">
            ← Terug naar home
          </Link>
        </p>
      </div>
    </div>
  )
}
