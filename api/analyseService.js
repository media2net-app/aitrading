/**
 * Daily analyse: market summary + simple pattern detection from bars.
 */
const { getBarsInRange } = require('./marketData')

const CONTEXT_DAYS = 5

function getDailyAnalysis(symbol, dateStr) {
  const from = new Date(dateStr)
  from.setDate(from.getDate() - CONTEXT_DAYS)
  const fromStr = from.toISOString().slice(0, 10)
  const bars = getBarsInRange(symbol, fromStr, dateStr)
  const dayBar = bars.filter((b) => b.date === dateStr)[0]
  if (!dayBar) {
    return {
      date: dateStr,
      symbol,
      market: null,
      patterns: [],
      dataSource: 'demo',
      error: 'Geen data voor deze datum',
    }
  }

  const market = {
    open: dayBar.open,
    high: dayBar.high,
    low: dayBar.low,
    close: dayBar.close,
    volume: dayBar.volume,
    trend: getTrend(dayBar),
  }

  const patterns = detectPatterns(bars, dateStr)

  return {
    date: dateStr,
    symbol,
    market,
    patterns,
    dataSource: 'demo',
  }
}

function getTrend(bar) {
  const diff = bar.close - bar.open
  const range = bar.high - bar.low
  if (range === 0) return 'sideways'
  if (diff > range * 0.1) return 'up'
  if (diff < -range * 0.1) return 'down'
  return 'sideways'
}

function detectPatterns(bars, targetDate) {
  const patterns = []
  const idx = bars.findIndex((b) => b.date === targetDate)
  if (idx < 0) return patterns

  const day = bars[idx]
  const prev = bars.slice(0, idx)

  if (prev.length >= 2) {
    const prevCloses = prev.map((b) => b.close)
    const prevHighs = prev.map((b) => b.high)
    const prevLows = prev.map((b) => b.low)

    if (prevCloses[prevCloses.length - 1] > prevCloses[prevCloses.length - 2] &&
        prevCloses[prevCloses.length - 2] > prevCloses[prevCloses.length - 3]) {
      patterns.push({
        name: 'Hogere bodems en toppen',
        type: 'continuation',
        direction: 'bullish',
        confidence: 0.7,
      })
    }
    if (prevCloses[prevCloses.length - 1] < prevCloses[prevCloses.length - 2] &&
        prevCloses[prevCloses.length - 2] < prevCloses[prevCloses.length - 3]) {
      patterns.push({
        name: 'Lagere toppen en bodems',
        type: 'continuation',
        direction: 'bearish',
        confidence: 0.7,
      })
    }

    const lastHigh = prevHighs[prevHighs.length - 1]
    const prevHigh = prevHighs[prevHighs.length - 2]
    if (prevHighs.length >= 3 && Math.abs(lastHigh - prevHigh) < (lastHigh * 0.002)) {
      patterns.push({
        name: 'Dubbele top',
        type: 'reversal',
        direction: 'bearish',
        confidence: 0.6,
      })
    }
    const lastLow = prevLows[prevLows.length - 1]
    const prevLow = prevLows[prevLows.length - 2]
    if (prevLows.length >= 3 && Math.abs(lastLow - prevLow) < (lastLow * 0.002)) {
      patterns.push({
        name: 'Dubbele bodem',
        type: 'reversal',
        direction: 'bullish',
        confidence: 0.6,
      })
    }
  }

  const bodySize = Math.abs(day.close - day.open)
  const range = day.high - day.low
  if (range > 0 && bodySize / range < 0.1) {
    patterns.push({
      name: 'Doji-achtige kaars',
      type: 'reversal',
      direction: 'bullish',
      confidence: 0.5,
    })
  }

  if (day.close > day.open && (day.low - day.open) > bodySize * 1.5) {
    patterns.push({
      name: 'Hammer-achtig',
      type: 'reversal',
      direction: 'bullish',
      confidence: 0.6,
    })
  }
  if (day.close < day.open && (day.high - day.open) > bodySize * 1.5) {
    patterns.push({
      name: 'Shooting star-achtig',
      type: 'reversal',
      direction: 'bearish',
      confidence: 0.6,
    })
  }

  return patterns
}

module.exports = {
  getDailyAnalysis,
}
