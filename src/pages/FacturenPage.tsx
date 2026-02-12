import { useState, useEffect } from 'react'
import { getAuthHeaders } from '../lib/api'

type InvoiceItem = { filename: string; label: string }

export default function FacturenPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    fetch('/api/user/invoices', { headers: getAuthHeaders(), signal: controller.signal })
      .then(async (res) => {
        const text = await res.text()
        let data: { success?: boolean; data?: { invoices?: InvoiceItem[] }; error?: string }
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          throw new Error('Server gaf geen geldig antwoord. Controleer of de backend draait (poort 3001).')
        }
        if (!res.ok || !data.success) {
          throw new Error(data?.error || `Fout bij laden (status ${res.status}).`)
        }
        return data
      })
      .then((data) => {
        if (cancelled) return
        setInvoices(Array.isArray(data.data?.invoices) ? data.data.invoices : [])
      })
      .catch((err) => {
        if (cancelled) return
        const msg =
          err.name === 'AbortError'
            ? 'Verzoek duurde te lang. Controleer of de backend draait (npm run server of start:all).'
            : err.message || 'Kon facturen niet laden.'
        setError(msg)
      })
      .finally(() => {
        clearTimeout(timeoutId)
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [retry])

  const handleDownload = async (filename: string) => {
    try {
      const res = await fetch(`/api/user/invoices/${encodeURIComponent(filename)}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Download mislukt')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download mislukt')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Facturen</h1>
      <p className="text-gray-400">
        Hier vind je je facturen. Klik op een factuur om te downloaden.
      </p>

      {loading && (
        <p className="text-gray-400">Laden...</p>
      )}
      {error && (
        <div className="space-y-2">
          <p className="text-amber-400">{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); setRetry((r) => r + 1) }}
            className="rounded border border-dark-500 px-3 py-1.5 text-sm text-gray-300 hover:bg-dark-600 hover:text-white"
          >
            Opnieuw proberen
          </button>
        </div>
      )}
      {!loading && !error && invoices.length === 0 && (
        <p className="text-gray-400">Er staan nog geen facturen voor je account.</p>
      )}
      {!loading && invoices.length > 0 && (
        <ul className="space-y-2">
          {invoices.map((inv) => (
            <li key={inv.filename}>
              <button
                type="button"
                onClick={() => handleDownload(inv.filename)}
                className="inline-flex items-center gap-2 rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 text-left text-gray-200 hover:border-dark-500 hover:bg-dark-700 hover:text-white"
              >
                <span className="font-medium">{inv.label}</span>
                <span className="text-gray-500">(PDF)</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}