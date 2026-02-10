import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'

type Mt5Settings = {
  mt5Account: string
  mt5Server: string
  mt5Company: string
  mt5Mode: string
  mt5BotPath: string
}

const emptySettings: Mt5Settings = {
  mt5Account: '',
  mt5Server: '',
  mt5Company: '',
  mt5Mode: '',
  mt5BotPath: '',
}

function getAuthHeaders(): HeadersInit {
  try {
    const stored = localStorage.getItem('aitrading_auth')
    if (!stored) return {}
    const data = JSON.parse(stored)
    if (data?.token) return { Authorization: `Bearer ${data.token}` }
  } catch {
    // ignore
  }
  return {}
}

export default function OnboardingMT5Form() {
  const { user } = useAuth()
  const [form, setForm] = useState<Mt5Settings>(emptySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/user/mt5-settings', { headers: getAuthHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error('Ophalen mislukt')
        return r.json()
      })
      .then((json) => {
        if (json.success && json.data) {
          setForm({
            mt5Account: json.data.mt5Account != null ? String(json.data.mt5Account) : '',
            mt5Server: json.data.mt5Server ?? '',
            mt5Company: json.data.mt5Company ?? '',
            mt5Mode: json.data.mt5Mode ?? '',
            mt5BotPath: json.data.mt5BotPath ?? '',
          })
        }
      })
      .catch(() => setForm(emptySettings))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    fetch('/api/user/mt5-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(form),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setMessage({ type: 'success', text: 'MT5-gegevens opgeslagen. Je kunt ze later nog aanpassen.' })
        } else {
          setMessage({ type: 'error', text: json.error || 'Opslaan mislukt' })
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Netwerkfout. Probeer het opnieuw.' }))
      .finally(() => setSaving(false))
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <p className="text-gray-400">MT5-gegevens laden...</p>
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
      <h2 className="text-lg font-semibold text-white">Welkom – voeg je MT5-gegevens toe</h2>
      <p className="mt-1 text-sm text-gray-400">
        Tijdens onboarding tonen we nog geen dashboardcijfers. Vul hier je MetaTrader 5-gegevens in; zodra je account actief is, gebruiken we deze voor je overzicht.
      </p>
      {user && (
        <p className="mt-2 text-sm text-gray-500">
          Ingelogd als <span className="text-gray-300">{user.email}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <div>
          <label htmlFor="mt5Account" className="block text-sm font-medium text-gray-300">
            MT5-rekeningnummer
          </label>
          <input
            id="mt5Account"
            type="text"
            inputMode="numeric"
            value={form.mt5Account}
            onChange={(e) => setForm((f) => ({ ...f, mt5Account: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="bijv. 12345678"
          />
        </div>
        <div>
          <label htmlFor="mt5Server" className="block text-sm font-medium text-gray-300">
            MT5-server
          </label>
          <input
            id="mt5Server"
            type="text"
            value={form.mt5Server}
            onChange={(e) => setForm((f) => ({ ...f, mt5Server: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="bijv. BrokerLive"
          />
        </div>
        <div>
          <label htmlFor="mt5Company" className="block text-sm font-medium text-gray-300">
            Broker / bedrijf
          </label>
          <input
            id="mt5Company"
            type="text"
            value={form.mt5Company}
            onChange={(e) => setForm((f) => ({ ...f, mt5Company: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="bijv. MijnBroker"
          />
        </div>
        <div>
          <label htmlFor="mt5Mode" className="block text-sm font-medium text-gray-300">
            Modus
          </label>
          <input
            id="mt5Mode"
            type="text"
            value={form.mt5Mode}
            onChange={(e) => setForm((f) => ({ ...f, mt5Mode: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="bijv. demo of live"
          />
        </div>
        <div>
          <label htmlFor="mt5BotPath" className="block text-sm font-medium text-gray-300">
            Bot-map (optioneel)
          </label>
          <input
            id="mt5BotPath"
            type="text"
            value={form.mt5BotPath}
            onChange={(e) => setForm((f) => ({ ...f, mt5BotPath: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="bijv. C:/Users/Public/Documents/MT5_AI_Bot/"
          />
          <p className="mt-1 text-xs text-gray-500">
            Alleen invullen als je een ander pad gebruikt dan de standaard MT5_AI_Bot-map.
          </p>
        </div>

        {message && (
          <p
            className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-amber-400'}`}
            role="alert"
          >
            {message.text}
          </p>
        )}

        <Button type="submit" disabled={saving} className="bg-accent text-white hover:bg-accent/90">
          {saving ? 'Opslaan...' : 'MT5-gegevens opslaan'}
        </Button>
      </form>
    </section>
  )
}
