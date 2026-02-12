import { useEffect, useState } from 'react'
import { fetchWithAuth } from '../lib/api'

type UserRow = {
  id: string
  email: string
  role?: string | null
  status?: string | null
  createdAt?: string
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchWithAuth('/api/admin/users')
        const text = await res.text()
        let json: { success?: boolean; data?: UserRow[]; error?: string } = {}
        try {
          json = text ? JSON.parse(text) : {}
        } catch {
          throw new Error('Ongeldig antwoord van server')
        }
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Kan gebruikers niet ophalen')
        }
        if (!cancelled) setUsers(json.data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Onbekende fout')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gebruikers (admin)</h1>
        <p className="mt-1 text-sm text-gray-400">
          Overzicht van alle gebruikers in het systeem. Wachtwoorden worden uit veiligheidsoverwegingen nooit getoond; gebruik
          het <code className="rounded bg-dark-700 px-1">create-user</code>-script om voor een gebruiker een nieuw wachtwoord
          in te stellen.
        </p>
      </div>

      {!loading && !error && users.some((u) => u.status === 'onboarding') && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <span className="font-semibold">Onboarding: true</span>{' '}
          <span className="text-amber-200">
            – er zijn {users.filter((u) => u.status === 'onboarding').length} gebruiker(s) met status <code
              className="rounded bg-amber-500/20 px-1"
            >
              onboarding
            </code>
            .
          </span>
        </div>
      )}

      {loading && (
        <p className="text-sm text-gray-400">
          Laden...
        </p>
      )}
      {error && !loading && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-dark-600 bg-dark-800/60">
          <table className="min-w-full text-sm text-gray-300">
            <thead>
              <tr className="border-b border-dark-600 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2 text-left">E-mailadres</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Aangemaakt</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-dark-700/60 last:border-0">
                  <td className="px-3 py-2 font-medium text-white">{u.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.role === 'admin'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-500/10 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {u.role || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs uppercase tracking-wide text-gray-300">{u.status || '—'}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleString('nl-NL') : '—'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-400">
                    Geen gebruikers gevonden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

