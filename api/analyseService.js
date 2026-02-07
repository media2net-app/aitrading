/**
 * Daily analyse: market summary + simple pattern detection from bars.
 * Day detail: intraday bars + pattern-based suggested entries for the trade bot.
 */
const { getBarsInRange, getIntradayBarsForDate, isFutureDate, isWeekend } = require('./marketData')

const CONTEXT_DAYS = 5

function getDailyAnalysis(symbol, dateStr) {
  if (isFutureDate(dateStr)) {
    return {
      date: dateStr,
      symbol,
      market: null,
      patterns: [],
      dataSource: 'demo',
      error: 'Datum in de toekomst – geen data beschikbaar. Kies vandaag of een eerdere datum.',
    }
  }
  if (isWeekend(dateStr)) {
    return {
      date: dateStr,
      symbol,
      market: null,
      patterns: [],
      dataSource: 'demo',
      error: 'Markt gesloten (weekend). XAUUSD/Forex handel 24/5, ma–vr.',
    }
  }
  const from = new Date(dateStr + 'T00:00:00Z')
  from.setUTCDate(from.getUTCDate() - CONTEXT_DAYS)
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

// --- Dagdetail: intraday bars + voorgestelde instapmomenten voor de bot ---

function getDayDetail(symbol, dateStr) {
  const daily = getDailyAnalysis(symbol, dateStr)
  const intraday = getIntradayBarsForDate(symbol, dateStr, '1H')
  const suggestedEntries = detectIntradayEntries(intraday)
  return {
    date: dateStr,
    symbol,
    daily: daily.market ? { ...daily.market, patterns: daily.patterns } : null,
    intraday,
    suggestedEntries,
    dataSource: daily.dataSource,
  }
}

/**
 * Scan intraday bars op candlestick- en contextpatronen; retourneer mogelijke instapmomenten.
 */
function detectIntradayEntries(bars) {
  const entries = []
  if (!bars || bars.length < 3) return entries

  for (let i = 2; i < bars.length; i++) {
    const curr = bars[i]
    const prev = bars[i - 1]
    const prev2 = bars[i - 2]
    const body = Math.abs(curr.close - curr.open)
    const range = curr.high - curr.low
    const upperWick = curr.high - Math.max(curr.open, curr.close)
    const lowerWick = Math.min(curr.open, curr.close) - curr.low
    const isBull = curr.close > curr.open

    // Hammer (bullish): kleine body, lange onderste lont, close in bovenhelft
    if (range > 0 && body / range < 0.35 && lowerWick > body * 1.5 && upperWick < body) {
      entries.push({
        time: curr.time,
        hour: curr.hour,
        price: curr.close,
        pattern: 'Hammer',
        direction: 'BUY',
        confidence: 0.65,
        reason: 'Bullish hammer: mogelijke bodem',
      })
    }
    // Shooting star (bearish)
    if (range > 0 && body / range < 0.35 && upperWick > body * 1.5 && lowerWick < body) {
      entries.push({
        time: curr.time,
        hour: curr.hour,
        price: curr.close,
        pattern: 'Shooting star',
        direction: 'SELL',
        confidence: 0.65,
        reason: 'Bearish shooting star: mogelijke top',
      })
    }
    // Bullish engulfing: vorige kaars bearish, huidige grotere groene kaars omvat vorige
    if (prev.close < prev.open && isBull && curr.open < prev.close && curr.close > prev.open &&
        (curr.close - curr.open) > (prev.open - prev.close)) {
      entries.push({
        time: curr.time,
        hour: curr.hour,
        price: curr.close,
        pattern: 'Bullish Engulfing',
        direction: 'BUY',
        confidence: 0.7,
        reason: 'Engulfing: sterke bullish omkering',
      })
    }
    // Bearish engulfing
    if (prev.close > prev.open && !isBull && curr.open > prev.close && curr.close < prev.open &&
        (curr.open - curr.close) > (prev.close - prev.open)) {
      entries.push({
        time: curr.time,
        hour: curr.hour,
        price: curr.close,
        pattern: 'Bearish Engulfing',
        direction: 'SELL',
        confidence: 0.7,
        reason: 'Engulfing: sterke bearish omkering',
      })
    }
    // Doji bij support (na 2 dalende kaarsen): mogelijke bounce
    if (range > 0 && body / range < 0.15 && prev2.close > prev2.open && prev.close < prev.open && prev.open < prev2.close) {
      entries.push({
        time: curr.time,
        hour: curr.hour,
        price: curr.close,
        pattern: 'Doji na daling',
        direction: 'BUY',
        confidence: 0.55,
        reason: 'Doji na bearish: mogelijke pauze/bounce',
      })
    }
    // Hogere bodem (2 opeenvolgende hogere lows) + groene sluiting
    if (i >= 2 && prev.low > prev2.low && curr.low > prev.low && isBull) {
      entries.push({
        time: curr.time,
        hour: curr.hour,
        price: curr.close,
        pattern: 'Hogere bodem',
        direction: 'BUY',
        confidence: 0.6,
        reason: 'Hogere bodems: opwaartse structuur',
      })
    }
  }

  return entries.sort((a, b) => a.hour - b.hour)
}

module.exports = {
  getDailyAnalysis,
  getDayDetail,
}
