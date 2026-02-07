import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchWithAuth } from '../lib/api'

const SYMBOL = 'XAUUSD'

type Market = {
  open: number
  high: number
  low: number
  close: number
  volume: number
  trend: string
}

type Pattern = {
  name: string
  type: string
  direction: string
  confidence?: number
}

type DailyResult = {
  date: string
  symbol: string
  market: Market | null
  patterns: Pattern[]
  dataSource: string
  error?: string
}

type MT5Status = {
  success: boolean
  connected: boolean
  data?: { symbol?: string; bid?: number }
}

function trendLabel(trend: string) {
  if (trend === 'up') return 'Stijgend'
  if (trend === 'down') return 'Dalend'
  return 'Zijwaarts'
}

export default function AnalysePage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [result, setResult] = useState<DailyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mt5Status, setMt5Status] = useState<MT5Status | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchWithAuth(`/api/analyse/daily?date=${date}&symbol=${SYMBOL}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.success) setResult(json.data)
        else setError(json.error || 'Fout bij ophalen')
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Netwerkfout')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [date])

  useEffect(() => {
    fetch('/api/mt5/status')
      .then((res) => res.json())
      .then((json) => setMt5Status(json))
      .catch(() => setMt5Status({ success: false, connected: false }))
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analyse</h1>
        <p className="mt-1 text-gray-400">
          Per dag: markt en gedetecteerde patronen (op basis van demo-data; later koppeling met MT5).
        </p>
      </div>

      {mt5Status && (
        <div className={`rounded-lg border px-4 py-2 text-sm ${mt5Status.connected ? 'border-accent/30 bg-accent/5 text-accent' : 'border-dark-600 bg-dark-800/50 text-gray-400'}`}>
          MT5: {mt5Status.connected ? `Verbonden ${mt5Status.data?.symbol ? `(${mt5Status.data.symbol})` : ''}` : 'Niet verbonden'}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm text-gray-400">
          Datum
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ml-2 rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-white"
          />
        </label>
        <span className="text-sm text-gray-500">{SYMBOL}</span>
      </div>

      {loading && (
        <p className="text-gray-400">Laden...</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && result && (
        <>
          {result.error && (
            <p className="text-amber-400">{result.error}</p>
          )}
          {result.dataSource === 'demo' && !result.error && (
            <p className="text-xs text-gray-500">Demo-data voor deze datum.</p>
          )}

          {result.market && (
            <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
              <h2 className="text-lg font-semibold text-white">Markt</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border border-dark-600 bg-dark-800/30 p-3">
                  <span className="text-xs text-gray-500">Open</span>
                  <p className="font-medium text-white">{result.market.open.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-dark-600 bg-dark-800/30 p-3">
                  <span className="text-xs text-gray-500">High</span>
                  <p className="font-medium text-white">{result.market.high.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-dark-600 bg-dark-800/30 p-3">
                  <span className="text-xs text-gray-500">Low</span>
                  <p className="font-medium text-white">{result.market.low.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-dark-600 bg-dark-800/30 p-3">
                  <span className="text-xs text-gray-500">Close</span>
                  <p className="font-medium text-white">{result.market.close.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-dark-600 bg-dark-800/30 p-3">
                  <span className="text-xs text-gray-500">Trend</span>
                  <p className={`font-medium ${result.market.trend === 'up' ? 'text-accent' : result.market.trend === 'down' ? 'text-red-400' : 'text-gray-300'}`}>
                    {trendLabel(result.market.trend)}
                  </p>
                </div>
              </div>
            </section>
          )}

          {result.patterns && result.patterns.length > 0 && (
            <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
              <h2 className="text-lg font-semibold text-white">Gedetecteerde patronen</h2>
              <p className="mt-1 text-sm text-gray-400">
                Eenvoudige detectie op basis van de beschikbare bars. <Link to="/dashboard/patronen" className="text-accent hover:underline">Uitleg patronen</Link>
              </p>
              <ul className="mt-4 space-y-2">
                {result.patterns.map((p, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3"
                  >
                    <span className="font-medium text-white">{p.name}</span>
                    <span className="text-xs text-gray-500">({p.type}, {p.direction})</span>
                    {p.confidence != null && (
                      <span className="text-xs text-gray-400">{(p.confidence * 100).toFixed(0)}%</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.market && result.patterns.length === 0 && (
            <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
              <h2 className="text-lg font-semibold text-white">Patronen</h2>
              <p className="mt-2 text-sm text-gray-400">Geen patronen gedetecteerd voor deze dag.</p>
              <Link to="/dashboard/patronen" className="mt-2 inline-block text-sm text-accent hover:underline">Bekijk uitleg over patronen</Link>
            </section>
          )}
        </>
      )}

      {!loading && !error && !result && (
        <p className="text-gray-400">Selecteer een datum om de analyse te laden.</p>
      )}
    </div>
  )
}
