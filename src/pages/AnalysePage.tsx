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
  path?: string
  statusFileExists?: boolean
}

type IntradayBar = {
  time: string
  hour: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type SuggestedEntry = {
  time: string
  hour: number
  price: number
  pattern: string
  direction: 'BUY' | 'SELL'
  confidence: number
  reason: string
}

type DayDetail = {
  date: string
  symbol: string
  daily: { open: number; high: number; low: number; close: number; volume: number; trend: string; patterns: Pattern[] } | null
  intraday: IntradayBar[]
  suggestedEntries: SuggestedEntry[]
  dataSource: string
}

function trendLabel(trend: string) {
  if (trend === 'up') return 'Stijgend'
  if (trend === 'down') return 'Dalend'
  return 'Zijwaarts'
}

export default function AnalysePage() {
  const [date, setDate] = useState('2026-02-06')
  const [result, setResult] = useState<DailyResult | null>(null)
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mt5Status, setMt5Status] = useState<MT5Status | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setDayDetail(null)

    async function parseJsonResponse(res: Response): Promise<unknown> {
      const text = await res.text()
      if (text.trimStart().startsWith('<')) {
        throw new Error('Backend geeft geen JSON. Draait de server op poort 3001? Start met: node server.js')
      }
      try {
        return JSON.parse(text)
      } catch {
        throw new Error('Ongeldig antwoord van de server. Start de backend met: node server.js')
      }
    }

    Promise.all([
      fetchWithAuth(`/api/analyse/daily?date=${date}&symbol=${SYMBOL}`).then(parseJsonResponse),
      fetchWithAuth(`/api/analyse/day-detail?date=${date}&symbol=${SYMBOL}`).then(parseJsonResponse),
    ])
      .then(([dailyJson, detailJson]) => {
        if (cancelled) return
        const daily = dailyJson as { success?: boolean; data?: DailyResult; error?: string }
        const detail = detailJson as { success?: boolean; data?: DayDetail }
        if (daily.success) setResult(daily.data ?? null)
        else setError(daily.error || 'Fout bij ophalen')
        if (detail.success) setDayDetail(detail.data ?? null)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Netwerkfout')
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
        <div className={`rounded-lg border px-4 py-3 text-sm ${mt5Status.connected ? 'border-accent/30 bg-accent/5 text-accent' : 'border-dark-600 bg-dark-800/50 text-gray-400'}`}>
          <div className="font-medium">
            MT5: {mt5Status.connected ? `Verbonden ${mt5Status.data?.symbol ? `(${mt5Status.data.symbol})` : ''}` : 'Niet verbonden'}
          </div>
          {!mt5Status.connected && (
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <p>De app kijkt naar <code className="rounded bg-dark-600 px-1 font-mono">{mt5Status.path || '…'}</code> voor <code className="rounded bg-dark-600 px-1">status.json</code>. Zet in je EA hetzelfde pad; de EA moet dat bestand daar schrijven met o.a. <code className="rounded bg-dark-600 px-1">connected: true</code>, <code className="rounded bg-dark-600 px-1">bid</code>, <code className="rounded bg-dark-600 px-1">ask</code>, <code className="rounded bg-dark-600 px-1">symbol</code>.</p>
              <p>Ander pad? Zet <code className="rounded bg-dark-600 px-1">MT5_BOT_PATH</code> in je <code className="rounded bg-dark-600 px-1">.env</code> en herstart de server.</p>
            </div>
          )}
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

          {dayDetail && dayDetail.intraday && dayDetail.intraday.length > 0 && (
            <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
              <h2 className="text-lg font-semibold text-white">Alle data {date} (1H-bars)</h2>
              <p className="mt-1 text-sm text-gray-400">
                Volledige reeks uurbalken voor analyse. Op basis van deze data zijn onderaan instapmomenten voor de trade bot voorgesteld.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-dark-500 text-gray-400">
                      <th className="pb-2 pr-4">Tijd</th>
                      <th className="pb-2 pr-4">Open</th>
                      <th className="pb-2 pr-4">High</th>
                      <th className="pb-2 pr-4">Low</th>
                      <th className="pb-2 pr-4">Close</th>
                      <th className="pb-2">Vol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayDetail.intraday.map((bar, i) => (
                      <tr key={i} className="border-b border-dark-600/50">
                        <td className="py-1.5 pr-4 font-mono text-white">{bar.time}</td>
                        <td className="py-1.5 pr-4 text-gray-300">{bar.open.toFixed(2)}</td>
                        <td className="py-1.5 pr-4 text-green-400">{bar.high.toFixed(2)}</td>
                        <td className="py-1.5 pr-4 text-red-400">{bar.low.toFixed(2)}</td>
                        <td className="py-1.5 pr-4 text-white">{bar.close.toFixed(2)}</td>
                        <td className="py-1.5 text-gray-500">{bar.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {dayDetail && dayDetail.suggestedEntries && dayDetail.suggestedEntries.length > 0 && (
            <section className="rounded-xl border border-accent/30 bg-accent/5 p-6">
              <h2 className="text-lg font-semibold text-accent">Instapmomenten voor de trade bot</h2>
              <p className="mt-1 text-sm text-gray-400">
                Waar de bot op basis van patronen in had kunnen zetten (tijd, prijs, richting).
              </p>
              <ul className="mt-4 space-y-3">
                {dayDetail.suggestedEntries.map((e, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-dark-600 bg-dark-800/50 px-4 py-3"
                  >
                    <span className="font-mono font-medium text-white">{e.time}</span>
                    <span className="text-white">{e.price.toFixed(2)}</span>
                    <span className={`rounded px-2 py-0.5 text-sm font-medium ${e.direction === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {e.direction}
                    </span>
                    <span className="text-gray-300">{e.pattern}</span>
                    <span className="text-xs text-gray-500">{(e.confidence * 100).toFixed(0)}%</span>
                    <span className="w-full text-sm text-gray-400 sm:w-auto">{e.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {dayDetail && dayDetail.suggestedEntries && dayDetail.suggestedEntries.length === 0 && dayDetail.intraday?.length > 0 && (
            <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
              <h2 className="text-lg font-semibold text-white">Instapmomenten</h2>
              <p className="mt-2 text-sm text-gray-400">Geen duidelijke instapmomenten gedetecteerd op basis van de huidige patronen voor deze dag.</p>
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
