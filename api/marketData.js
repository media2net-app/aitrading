/**
 * Demo daily bars voor analyse (deterministic per date).
 * XAUUSD (goud) rond ~4965 (feb 2026). Markt 24/5: alleen ma–vr, geen toekomst/weekend.
 * Phase 2: echte data uit MT5_AI_Bot/daily_bars.json.
 */
const BASE_PRICE = 4965

function getTodayStr() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function isFutureDate(dateStr) {
  return dateStr > getTodayStr()
}

function isWeekend(dateStr) {
  const day = new Date(dateStr + 'T12:00:00Z').getUTCDay()
  return day === 0 || day === 6
}

function seededRandom(seed) {
  let s = 0
  for (let i = 0; i < seed.length; i++) {
    s = (s << 5) - s + seed.charCodeAt(i)
    s |= 0
  }
  return () => {
    s = Math.imul(48271, s) >>> 0
    return (s & 0x7fffffff) / 0x7fffffff
  }
}

function getBarsInRange(symbol, fromStr, toStr) {
  const from = new Date(fromStr + 'T00:00:00Z')
  const to = new Date(toStr + 'T00:00:00Z')
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return []
  }
  const bars = []
  const dayMs = 24 * 60 * 60 * 1000
  let current = new Date(from.getTime())

  const todayStr = getTodayStr()
  while (current <= to) {
    const dateStr = current.toISOString().slice(0, 10)
    if (dateStr > todayStr) {
      current.setTime(current.getTime() + dayMs)
      continue
    }
    if (isWeekend(dateStr)) {
      current.setTime(current.getTime() + dayMs)
      continue
    }
    const rng = seededRandom(`${symbol}-${dateStr}`)
    const open = bars.length > 0 ? bars[bars.length - 1].close : BASE_PRICE + (rng() - 0.5) * 80
    const change = (rng() - 0.5) * 60
    const volatility = rng() * 25
    const high = open + Math.max(change, 0) + volatility
    const low = open + Math.min(change, 0) - volatility
    const close = open + change
    const volume = Math.floor(5000 + rng() * 15000)
    bars.push({
      timestamp: current.getTime(),
      date: dateStr,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    })
    current.setTime(current.getTime() + dayMs)
  }
  return bars
}

function getBarsForDate(symbol, dateStr) {
  return getBarsInRange(symbol, dateStr, dateStr)
}

/**
 * Genereer 1H-bars voor één dag die binnen de dag-OHLC blijven (deterministisch).
 * Voor analyse: waar had de bot kunnen instappen op basis van patronen?
 * Geen data voor toekomst of weekend (markt 24/5).
 */
function getIntradayBarsForDate(symbol, dateStr, timeframe = '1H') {
  if (isFutureDate(dateStr)) return []
  if (isWeekend(dateStr)) return []
  const dayBars = getBarsInRange(symbol, dateStr, dateStr)
  const dayBar = dayBars[0]
  if (!dayBar) return []

  const rng = seededRandom(`${symbol}-${dateStr}-intra`)
  const o = dayBar.open
  const h = dayBar.high
  const l = dayBar.low
  const c = dayBar.close
  const range = h - l
  const n = timeframe === '15m' ? 96 : 24
  const bars = []
  let prevClose = o
  const highBar = Math.min(n - 1, Math.floor(rng() * n * 0.7))
  let lowBar = Math.min(n - 1, Math.floor(rng() * n * 0.7) + Math.floor(n * 0.3))
  if (lowBar >= n) lowBar = n - 2
  if (highBar === lowBar) {
    lowBar = highBar >= n / 2 ? highBar - 2 : highBar + 2
  }

  for (let i = 0; i < n; i++) {
    const t = new Date(dateStr)
    if (timeframe === '15m') {
      t.setUTCHours(Math.floor(i / 4), (i % 4) * 15, 0, 0)
    } else {
      t.setUTCHours(i, 0, 0, 0)
    }
    const progress = (i + 1) / n
    const targetClose = i === n - 1 ? c : o + (c - o) * progress + (rng() - 0.5) * range * 0.12
    const barRange = range * (0.04 + rng() * 0.1)
    let barHigh = prevClose + barRange * rng()
    let barLow = prevClose - barRange * (1 - rng())
    if (i === highBar) barHigh = h
    else barHigh = Math.min(barHigh, h)
    if (i === lowBar) barLow = l
    else barLow = Math.max(barLow, l)
    const barOpen = prevClose
    let barClose = i === n - 1 ? c : targetClose
    if (barClose > barHigh) barClose = barHigh
    if (barClose < barLow) barClose = barLow
    prevClose = barClose
    bars.push({
      timestamp: t.getTime(),
      date: dateStr,
      time: t.toISOString().slice(11, 16),
      hour: i,
      open: Math.round(barOpen * 100) / 100,
      high: Math.round(barHigh * 100) / 100,
      low: Math.round(barLow * 100) / 100,
      close: Math.round(barClose * 100) / 100,
      volume: Math.floor(dayBar.volume / n + rng() * 200),
    })
  }

  return bars
}

module.exports = {
  getBarsInRange,
  getBarsForDate,
  getIntradayBarsForDate,
  getTodayStr,
  isFutureDate,
  isWeekend,
}
