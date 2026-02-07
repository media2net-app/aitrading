/**
 * Demo daily bars for analyse (deterministic per date).
 * Phase 2: can switch to reading MT5_AI_Bot/daily_bars.json when present.
 */
const BASE_PRICE = 2650

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
  const from = new Date(fromStr)
  const to = new Date(toStr)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return []
  }
  const bars = []
  const dayMs = 24 * 60 * 60 * 1000
  let current = new Date(from)
  current.setHours(0, 0, 0, 0)

  while (current <= to) {
    const dateStr = current.toISOString().slice(0, 10)
    const rng = seededRandom(`${symbol}-${dateStr}`)
    const open = bars.length > 0 ? bars[bars.length - 1].close : BASE_PRICE + (rng() - 0.5) * 100
    const change = (rng() - 0.5) * 40
    const volatility = rng() * 15
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

module.exports = {
  getBarsInRange,
  getBarsForDate,
}
