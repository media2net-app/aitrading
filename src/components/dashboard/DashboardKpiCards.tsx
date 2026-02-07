import { useState, useEffect } from 'react'

type MT5Status = {
  success: boolean
  connected?: boolean
  data?: {
    balance?: number
    equity?: number
    profit?: number
    openPositions?: unknown[]
    version?: string
  }
  path?: string
  statusFileExists?: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export default function DashboardKpiCards() {
  const [mt5, setMt5] = useState<MT5Status | null>(null)

  useEffect(() => {
    fetch('/api/mt5/status')
      .then((r) => r.json())
      .then(setMt5)
      .catch(() => setMt5(null))
  }, [])

  const balance = mt5?.data?.balance
  const equity = mt5?.data?.equity
  const profit = mt5?.data?.profit ?? (typeof equity === 'number' && typeof balance === 'number' ? equity - balance : null)
  const openCount = mt5?.data?.openPositions?.length ?? 0

  const hasData = typeof balance === 'number' || typeof equity === 'number'

  const kpis = [
    {
      label: 'Balance',
      value: typeof balance === 'number' ? formatCurrency(balance) : '—',
      sub: 'Startkapitaal',
      positive: null as boolean | null,
    },
    {
      label: 'P&L',
      value: typeof profit === 'number' ? (profit >= 0 ? '+ ' : '') + formatCurrency(profit) : '—',
      sub: typeof balance === 'number' && typeof equity === 'number' && balance > 0
        ? `${((equity - balance) / balance * 100).toFixed(1)}%`
        : null,
      positive: typeof profit === 'number' ? profit >= 0 : null,
    },
    {
      label: 'Open trades',
      value: String(openCount),
      sub: 'Actieve posities',
      positive: null as boolean | null,
    },
    {
      label: 'Win rate',
      value: '—',
      sub: 'Laatste 30 dagen (uit gesloten trades)',
      positive: null as boolean | null,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map(({ label, value, sub, positive }) => (
        <div
          key={label}
          className="rounded-xl border border-dark-600 bg-dark-800/50 p-5 transition hover:border-dark-500"
        >
          <div className="text-sm font-medium text-gray-400">{label}</div>
          <div
            className={`mt-2 text-2xl font-bold ${
              positive === true
                ? 'text-accent'
                : positive === false
                  ? 'text-red-400'
                  : 'text-white'
            }`}
          >
            {value}
          </div>
          {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
        </div>
      ))}
      {!hasData && (
        <div className="col-span-full space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-xs text-amber-200">
            Geen live balance/P&amp;L. Gegevens komen uit MT5 via status.json (EA v5.0 schrijft balance/equity/profit).
          </p>
          <p className="text-xs text-gray-400">
            Controleer: (1) EA v5.0 draait en schrijft naar de MT5-bridge map hierboven, (2) of zet in .env als fallback: <code className="rounded bg-dark-700 px-1">MT5_BALANCE</code>, <code className="rounded bg-dark-700 px-1">MT5_EQUITY</code>, <code className="rounded bg-dark-700 px-1">MT5_PROFIT</code>. Daarna pagina vernieuwen.
          </p>
        </div>
      )}
    </div>
  )
}
