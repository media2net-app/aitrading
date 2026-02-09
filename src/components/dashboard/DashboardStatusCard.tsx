import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

type MT5Status = {
  success: boolean
  connected: boolean
  data?: {
    symbol?: string
    bid?: number
    ask?: number
    account?: number
    login?: number
    server?: string
    company?: string
    mode?: string
    version?: string
    [key: string]: unknown
  }
  path?: string
  bridge?: {
    pathUsed?: string
    keysInFile?: string[]
    fileLastModified?: number | null
    fieldsWeCanFetch?: string[]
  }
}

type AppInfo = {
  success: boolean
  data?: { apiServer?: string; port?: number }
}

export default function DashboardStatusCard() {
  const { user } = useAuth()
  const [mt5, setMt5] = useState<MT5Status | null>(null)
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [mt5Loading, setMt5Loading] = useState(true)
  const [mt5Error, setMt5Error] = useState<string | null>(null)

  const fetchMt5Status = () => {
    setMt5Loading(true)
    setMt5Error(null)
    fetch('/api/mt5/status')
      .then((r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`)
        return r.json()
      })
      .then((json) => {
        setMt5(json)
        if (!json.success) setMt5Error('MT5-status kon niet worden opgehaald.')
      })
      .catch(() => {
        setMt5({ success: false, connected: false })
        setMt5Error('Backend niet bereikbaar? Start de server (node server.js) en controleer .env (MT5_ACCOUNT, MT5_SERVER, etc.) of EA status.json.')
      })
      .finally(() => setMt5Loading(false))
  }

  useEffect(() => {
    fetchMt5Status()
    const interval = setInterval(fetchMt5Status, 30000)
    return () => clearInterval(interval)
  }, [])
  useEffect(() => {
    fetch('/api/app-info')
      .then((r) => r.json())
      .then(setAppInfo)
      .catch(() => setAppInfo(null))
  }, [])

  const accountLabel = mt5?.data?.login ?? mt5?.data?.account ?? null
  const serverLabel = mt5?.data?.server ?? null
  const companyLabel = mt5?.data?.company ?? null
  const modeLabel = mt5?.data?.mode ?? null
  const eaVersion = mt5?.data?.version ?? null
  const hasMt5AccountInfo = accountLabel != null || serverLabel != null || companyLabel != null || modeLabel != null

  return (
    <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
      <h2 className="text-lg font-semibold text-white">Account & verbindingen</h2>
      <p className="mt-1 text-sm text-gray-400">
        Ingelogde gebruiker, MT5-status en API-server. Rekening/server/broker komen uit de EA via status.json (zelfde op elke PC, elk zijn eigen account).
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {user && (
          <>
            <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">Ingelogd als</dt>
              <dd className="mt-1 font-medium text-white">{user.email}</dd>
            </div>
            <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">Gebruiker-ID</dt>
              <dd className="mt-1 font-mono text-sm text-gray-300" title={user.id}>
                {user.id.slice(0, 8)}…
              </dd>
            </div>
          </>
        )}
        <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">API-server</dt>
          <dd className="mt-1 font-mono text-sm text-white">
            {appInfo?.data?.apiServer ?? '…'}
          </dd>
        </div>
        <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">MT5 verbonden</dt>
          <dd className="mt-1 flex items-center gap-2">
            {mt5Loading ? (
              <span className="text-gray-500">Laden…</span>
            ) : (
              <>
                <span
                  className={`inline-block h-2 w-2 rounded-full ${mt5?.connected ? 'bg-green-500' : 'bg-gray-500'}`}
                  aria-hidden
                />
                <span className={mt5?.connected ? 'text-green-400' : 'text-gray-400'}>
                  {mt5?.connected ? 'Ja' : 'Nee'}
                </span>
                {mt5?.connected && mt5.data?.symbol && (
                  <span className="text-gray-400">({mt5.data.symbol})</span>
                )}
              </>
            )}
          </dd>
        </div>
        {mt5Error && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-amber-400">{mt5Error}</p>
          </div>
        )}
        {!mt5Loading && !hasMt5AccountInfo && !mt5Error && (
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3 sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-gray-500">Geen MT5-rekeninggegevens. Zet in .env: MT5_ACCOUNT, MT5_SERVER, MT5_COMPANY, MT5_MODE of laat de EA ze in status.json schrijven.</p>
          </div>
        )}
        {accountLabel != null && (
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">MT5-rekening</dt>
            <dd className="mt-1 font-mono text-sm text-white">{String(accountLabel)}</dd>
          </div>
        )}
        {serverLabel && (
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">MT5-server</dt>
            <dd className="mt-1 font-mono text-sm text-gray-300">{serverLabel}</dd>
          </div>
        )}
        {companyLabel && (
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">Broker</dt>
            <dd className="mt-1 text-sm text-gray-300">{companyLabel}</dd>
          </div>
        )}
        {modeLabel && (
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">Accountmodus</dt>
            <dd className="mt-1 text-sm text-gray-300">{modeLabel}</dd>
          </div>
        )}
        {eaVersion && (
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">AI Bot / EA-versie</dt>
            <dd className="mt-1 font-mono text-sm text-white">v{eaVersion}</dd>
          </div>
        )}
        {mt5?.path && (
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3 sm:col-span-2 lg:col-span-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">MT5-bridge map (geconfigureerd)</dt>
            <dd className="mt-1 break-all font-mono text-xs text-gray-400">{mt5.path}</dd>
          </div>
        )}
        {mt5?.bridge && (
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 px-4 py-3 sm:col-span-2 lg:col-span-3 space-y-2">
            <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">Bridge: wat we ophalen</dt>
            <dd className="text-xs text-gray-400">
              <p className="mb-1">Velden die de EA kan schrijven en we kunnen tonen: {mt5.bridge.fieldsWeCanFetch?.join(', ') ?? '—'}</p>
              <p className="mb-1"><span className="text-gray-500">Gelezen van:</span> <span className="font-mono break-all">{mt5.bridge.pathUsed ?? '—'}</span></p>
              <p className="mb-1"><span className="text-gray-500">In status.json gevonden:</span> {mt5.bridge.keysInFile?.length ? mt5.bridge.keysInFile.join(', ') : 'geen'}</p>
              {mt5.bridge.fileLastModified != null && (
                <p><span className="text-gray-500">Laatste wijziging bestand:</span> {new Date(mt5.bridge.fileLastModified).toLocaleString('nl-NL')}</p>
              )}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}
