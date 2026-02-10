import { useState, useEffect } from 'react'

type EquityPoint = { t: number; equity: number }

export default function DashboardChart() {
  const [points, setPoints] = useState<EquityPoint[]>([])
  const [currentEquity, setCurrentEquity] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/mt5/equity-history')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) setPoints(json.data)
      })
      .catch(() => setPoints([]))
  }, [])

  useEffect(() => {
    fetch('/api/mt5/status', {
      headers: (() => {
        const h: Record<string, string> = {}
        try {
          const d = JSON.parse(localStorage.getItem('aitrading_auth') || '{}')
          if (d?.token) h.Authorization = `Bearer ${d.token}`
        } catch {
          // negeer
        }
        return h
      })(),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          if (typeof json.data.equity === 'number') setCurrentEquity(json.data.equity)
          if (typeof json.data.balance === 'number') setBalance(json.data.balance)
        }
      })
      .catch(() => {})
  }, [])

  const series = points.length > 0
    ? points
    : balance != null && currentEquity != null
      ? [
          { t: Date.now() - 60000, equity: balance },
          { t: Date.now(), equity: currentEquity },
        ]
      : currentEquity != null
        ? [{ t: Date.now(), equity: currentEquity }]
        : []

  const minE = series.length > 0 ? Math.min(...series.map((p) => p.equity)) : 0
  const maxE = series.length > 0 ? Math.max(...series.map((p) => p.equity)) : 1
  const range = maxE - minE || 1
  const minT = series.length > 0 ? Math.min(...series.map((p) => p.t)) : 0
  const maxT = series.length > 0 ? Math.max(...series.map((p) => p.t)) : 1
  const rangeT = maxT - minT || 1

  const w = 320
  const h = 100
  const pad = 4
  const pathPoints = series.map((p, i) => {
    const x = pad + ((p.t - minT) / rangeT) * (w - 2 * pad)
    const y = h - pad - ((p.equity - minE) / range) * (h - 2 * pad)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  })
  const pathD = pathPoints.join(' ')
  const areaD = pathPoints.length ? `${pathD} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z` : ''

  return (
    <div className="mt-6 h-64 w-full">
      {series.length > 0 ? (
        <>
          <p className="mb-2 text-xs text-gray-500">
            Equity over tijd {points.length > 0 ? `(${points.length} punten uit MT5)` : '(huidige stand)'}.
          </p>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="h-full w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="1" y2="0">
                <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {areaD && (
              <path d={areaD} fill="url(#chartGradient)" />
            )}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </>
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dark-600 bg-dark-800/30 text-gray-500">
          <p className="text-sm">
            Geen equity-data. Zorg dat de EA balance/equity in status.json schrijft; de curve wordt dan opgebouwd.
          </p>
        </div>
      )}
    </div>
  )
}
