import { useState, useEffect, useRef } from 'react'
import { fetchWithAuth } from '../lib/api'

const SYMBOL = 'XAUUSD'

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
  daily: unknown
  intraday: unknown[]
  suggestedEntries: SuggestedEntry[]
  dataSource: string
}

const DEFAULT_LOT_SIZE = 0.01
const DEFAULT_TP1 = 10
const DEFAULT_TP2 = 20
const DEFAULT_TP3 = 30
const DEFAULT_SL = 15
const MIN_CONFIDENCE = 0.65

export default function TradeBotPage() {
  const [lotSize, setLotSize] = useState(DEFAULT_LOT_SIZE)
  const [tp1, setTp1] = useState(DEFAULT_TP1)
  const [tp2, setTp2] = useState(DEFAULT_TP2)
  const [tp3, setTp3] = useState(DEFAULT_TP3)
  const [stopLoss, setStopLoss] = useState(DEFAULT_SL)
  const [minConfidence, setMinConfidence] = useState(MIN_CONFIDENCE)
  const [activating, setActivating] = useState(false)
  const [testTradeLoading, setTestTradeLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [step, setStep] = useState<string | null>(null)
  const [bridgeLog, setBridgeLog] = useState<string>('')
  const [bridgeLogPath, setBridgeLogPath] = useState<string | null>(null)
  const logEndRef = useRef<HTMLPreElement>(null)

  // Poll bridge log voor terminal-weergave (elke 2 s)
  useEffect(() => {
    let cancelled = false
    async function fetchLog() {
      try {
        const res = await fetch('/api/mt5/log?lines=300')
        const json = (await res.json()) as {
          success?: boolean
          data?: { content: string; path: string; empty: boolean }
          error?: string
        }
        if (cancelled || !json.success) return
        if (json.data) {
          setBridgeLog(json.data.content || '')
          if (json.data.path) setBridgeLogPath(json.data.path)
        }
      } catch {
        // negeer
      }
    }
    fetchLog()
    const interval = setInterval(fetchLog, 2000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (bridgeLog) logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [bridgeLog])

  function getTodayStr() {
    return new Date().toISOString().slice(0, 10)
  }

  async function handleActiveren() {
    setMessage(null)
    setStep('Analyseren van vandaag…')
    setActivating(true)
    const today = getTodayStr()

    try {
      const res = await fetchWithAuth(
        `/api/analyse/day-detail?date=${today}&symbol=${SYMBOL}`
      )
      const json = (await res.json()) as {
        success: boolean
        data?: DayDetail
        error?: string
      }

      if (!json.success || !json.data) {
        setStep(null)
        setMessage({
          type: 'error',
          text: json.error || 'Kon vandaagse analyse niet ophalen.',
        })
        setActivating(false)
        return
      }

      const detail = json.data
      setStep(`${detail.suggestedEntries?.length ?? 0} instapmomenten gevonden. Signaal beoordelen…`)

      if (!detail.suggestedEntries?.length) {
        setStep(null)
        setMessage({
          type: 'info',
          text: 'Analyse klaar. Geen instapmomenten voor vandaag. De bot plaatst geen trade.',
        })
        setActivating(false)
        return
      }

      const above = detail.suggestedEntries.filter(
        (e) => e.confidence >= minConfidence
      )
      const best = above.length
        ? above.reduce((a, b) => (a.confidence >= b.confidence ? a : b))
        : null

      if (!best) {
        const highest = Math.max(...detail.suggestedEntries.map((e) => e.confidence))
        setStep(null)
        setMessage({
          type: 'info',
          text: `Analyse klaar. Geen signaal met voldoende confidence (min. ${(minConfidence * 100).toFixed(0)}%). Hoogste vandaag: ${(highest * 100).toFixed(0)}%. Geen trade geplaatst.`,
        })
        setActivating(false)
        return
      }

      setStep(`Signaal: ${best.direction} @ ${best.price.toFixed(2)} (${(best.confidence * 100).toFixed(0)}%). Trade plaatsen…`)

      const entryPrice = best.price
      const isBuy = best.direction === 'BUY'
      const slVal = stopLoss
      const tp1Val = isBuy ? entryPrice + tp1 : entryPrice - tp1
      const tp2Val = isBuy ? entryPrice + tp2 : entryPrice - tp2
      const tp3Val = isBuy ? entryPrice + tp3 : entryPrice - tp3
      const slPrice = isBuy ? entryPrice - slVal : entryPrice + slVal

      const orderRes = await fetch('/api/mt5/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: best.direction,
          symbol: SYMBOL,
          volume: lotSize,
          entryPrice,
          stopLoss: slPrice,
          tp1: tp1Val,
          tp2: tp2Val,
          tp3: tp3Val,
        }),
      })

      const orderJson = (await orderRes.json()) as {
        success?: boolean
        data?: { message?: string }
        error?: string
      }

      setStep(null)
      if (orderJson.success) {
        setMessage({
          type: 'success',
          text: `Trade geplaatst: ${best.direction} @ ${entryPrice.toFixed(2)} (${best.pattern}, ${(best.confidence * 100).toFixed(0)}% confidence). SL: ${slPrice.toFixed(2)}, TP1/2/3: ${tp1Val.toFixed(2)} / ${tp2Val.toFixed(2)} / ${tp3Val.toFixed(2)}.`,
        })
      } else {
        setMessage({
          type: 'error',
          text: orderJson.error || orderJson.data?.message || 'Order plaatsen mislukt.',
        })
      }
    } catch (err) {
      setStep(null)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Er is een fout opgetreden.',
      })
    } finally {
      setActivating(false)
    }
  }

  async function handleTestTradeBuy() {
    setMessage(null)
    setTestTradeLoading(true)
    try {
      const priceRes = await fetch('/api/mt5/price')
      const priceJson = (await priceRes.json()) as {
        success?: boolean
        data?: { ask?: number; bid?: number; price?: number }
        error?: string
      }
      if (!priceJson.success || !priceJson.data) {
        setMessage({
          type: 'error',
          text: priceJson.error || 'Kon prijs niet ophalen. Is MT5 verbonden?',
        })
        setTestTradeLoading(false)
        return
      }
      const entryPrice = priceJson.data.ask ?? priceJson.data.price ?? priceJson.data.bid ?? 0
      if (!entryPrice) {
        setMessage({ type: 'error', text: 'Geen ask/prijs in MT5-status.' })
        setTestTradeLoading(false)
        return
      }
      const slPrice = entryPrice - stopLoss
      const tp1Val = entryPrice + tp1
      const tp2Val = entryPrice + tp2
      const tp3Val = entryPrice + tp3

      const orderRes = await fetch('/api/mt5/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BUY',
          symbol: SYMBOL,
          volume: lotSize,
          entryPrice,
          stopLoss: slPrice,
          tp1: tp1Val,
          tp2: tp2Val,
          tp3: tp3Val,
        }),
      })
      const orderJson = (await orderRes.json()) as {
        success?: boolean
        data?: { message?: string }
        error?: string
      }
      if (orderJson.success) {
        setMessage({
          type: 'success',
          text: `Test trade BUY geplaatst @ ${entryPrice.toFixed(2)}. SL: ${slPrice.toFixed(2)}, TP1/2/3: ${tp1Val.toFixed(2)} / ${tp2Val.toFixed(2)} / ${tp3Val.toFixed(2)}. Controleer in MT5 of de order binnenkomt.`,
        })
      } else {
        setMessage({
          type: 'error',
          text: orderJson.error || orderJson.data?.message || 'Test order mislukt.',
        })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Fout bij test trade.',
      })
    } finally {
      setTestTradeLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade bot</h1>
        <p className="mt-1 text-gray-400">
          Stel de trade-instellingen in. Bij &quot;Activeren&quot; analyseert de bot de data van vandaag en plaatst bij voldoende confidence een trade met jouw SL en TP-niveaus.
        </p>
      </div>

      <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <h2 className="text-lg font-semibold text-white">Trade-instellingen</h2>
        <p className="mt-1 text-sm text-gray-400">
          Lotsize, Take Profit 1–3 en Stop loss (in punten vanaf entry). Bij plaatsing worden TP/SL omgerekend naar absolute prijzen.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="text-sm text-gray-400">Lot size</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={lotSize}
              onChange={(e) => setLotSize(Number(e.target.value) || 0.01)}
              className="mt-1 w-full rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-white"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Stop loss (punten)</span>
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-white"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">TP 1 (punten)</span>
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={tp1}
              onChange={(e) => setTp1(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-white"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">TP 2 (punten)</span>
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={tp2}
              onChange={(e) => setTp2(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-white"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">TP 3 (punten)</span>
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={tp3}
              onChange={(e) => setTp3(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-white"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Min. confidence (0–1)</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-dark-500 bg-dark-700 px-3 py-2 text-white"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Alleen signaal plaatsen bij confidence ≥ {(minConfidence * 100).toFixed(0)}%
            </span>
          </label>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleActiveren}
            disabled={activating || testTradeLoading}
            className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {activating ? 'Analyseren…' : 'Activeren'}
          </button>
          <button
            type="button"
            onClick={handleTestTradeBuy}
            disabled={activating || testTradeLoading}
            className="rounded-lg border border-dark-500 bg-dark-700 px-6 py-3 font-medium text-white transition-opacity hover:bg-dark-600 disabled:opacity-50"
          >
            {testTradeLoading ? 'Bezig…' : 'Test trade (BUY)'}
          </button>
        </div>
        {step && (
          <p className="mt-3 text-sm text-gray-400">
            {step}
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          <strong>Activeren:</strong> analyseert eerst de data van vandaag ({getTodayStr()}). Alleen bij een signaal met voldoende confidence wordt één trade geplaatst. <strong>Test trade (BUY):</strong> plaatst direct een BUY op de huidige MT5-prijs om de koppeling te testen.
        </p>
      </section>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-green-500/50 bg-green-500/10 text-green-400'
              : message.type === 'error'
                ? 'border-red-500/50 bg-red-500/10 text-red-400'
                : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <h2 className="text-lg font-semibold text-white">Bridge / terminal log</h2>
        <p className="mt-1 text-sm text-gray-400">
          Live log van de MT5-bridge (readStatus, placeOrder, waitForResponse). Vernieuwt elke 2 seconden. Zo kun je controleren of de connectie met de EA werkt.
        </p>
        {bridgeLogPath && (
          <p className="mt-1 text-xs text-gray-500 truncate" title={bridgeLogPath}>
            Bestand: {bridgeLogPath}
          </p>
        )}
        <div className="mt-4 overflow-hidden rounded-lg border border-dark-600 bg-black/60">
          <pre
            ref={logEndRef}
            className="max-h-80 overflow-auto p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap break-all"
          >
            {bridgeLog || '(Geen logregels nog. Zorg dat de EA draait en dat status/orders worden opgehaald of geplaatst.)'}
          </pre>
        </div>
      </section>
    </div>
  )
}
