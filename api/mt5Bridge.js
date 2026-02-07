/**
 * MT5 file-based bridge: read status from EA, write commands for orders.
 * Same approach as aittrader; uses MT5_AI_Bot folder (Mac/Wine or MT5_BOT_PATH).
 * Sommige brokers gebruiken "GOLD" i.p.v. "XAUUSD" – zet MT5_SYMBOL_GOLD=GOLD in .env.
 */
const fs = require('fs')
const path = require('path')
const os = require('os')

/** Symbool voor goud dat naar MT5/EA wordt gestuurd (orders). Broker-specifiek: vaak XAUUSD of GOLD. */
function getGoldSymbol() {
  return process.env.MT5_SYMBOL_GOLD || 'XAUUSD'
}

function getMT5Path() {
  if (process.env.MT5_BOT_PATH) {
    return process.env.MT5_BOT_PATH
  }
  return path.join(
    os.homedir(),
    '.wine',
    'drive_c',
    'Users',
    'Public',
    'Documents',
    'MT5_AI_Bot'
  )
}

/** Alternatieve paden waar de EA (FILE_COMMON) status.json kan schrijven. Probeer deze als primair pad geen balance/equity heeft. */
function getAlternateMT5Paths() {
  const primary = getMT5Path()
  const candidates = [primary]
  const base = path.join(os.homedir(), '.wine', 'drive_c', 'Users', 'Public', 'Documents')
  candidates.push(path.join(base, 'MetaQuotes', 'Terminal', 'Common', 'Files', 'MT5_AI_Bot'))
  candidates.push(path.join(base, 'MT5_AI_Bot'))
  return [...new Set(candidates)]
}

class MT5Bridge {
  constructor() {
    this.mt5Path = getMT5Path()
    this.commandFile = path.join(this.mt5Path, 'commands.json')
    this.responseFile = path.join(this.mt5Path, 'responses.json')
    this.statusFile = path.join(this.mt5Path, 'status.json')
    this.ensureDirectory()
  }

  /** Lees status.json van een gegeven map. Retourneert { status, keysInFile, mtime } of null. */
  readStatusFromPath(dir) {
    const statusPath = path.join(dir, 'status.json')
    try {
      if (!fs.existsSync(statusPath)) return null
      const content = fs.readFileSync(statusPath, 'utf8')
      const status = JSON.parse(content)
      const stat = fs.statSync(statusPath)
      return {
        status,
        keysInFile: status && typeof status === 'object' ? Object.keys(status) : [],
        mtime: stat.mtime ? stat.mtime.getTime() : null,
        pathUsed: dir,
      }
    } catch {
      return null
    }
  }

  ensureDirectory() {
    if (!fs.existsSync(this.mt5Path)) {
      fs.mkdirSync(this.mt5Path, { recursive: true })
    }
  }

  /** Schrijf een standaard status.json als die ontbreekt (demo). EA overschrijft met echte data. */
  writeDefaultStatus() {
    const mid = 4965 + Math.random() * 4
    const spread = 0.2
    const balance = 25000
    const equity = balance + (Math.random() - 0.5) * 500
    const status = {
      connected: true,
      symbol: 'XAUUSD',
      bid: Math.round((mid - spread / 2) * 100) / 100,
      ask: Math.round((mid + spread / 2) * 100) / 100,
      spread,
      timestamp: Math.floor(Date.now() / 1000),
      balance,
      equity: Math.round(equity * 100) / 100,
      profit: Math.round((equity - balance) * 100) / 100,
      openPositions: [],
      source: 'demo',
    }
    try {
      fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2), 'utf8')
      return status
    } catch {
      return null
    }
  }

  /** Is dit status van de EA (niet demo)? */
  isEaStatus(s) {
    if (!s || typeof s !== 'object') return false
    return s.version != null || (s.login != null && s.source !== 'demo')
  }

  /**
   * Lees status: probeer alle paden, prefereer EA-status (version/login, geen demo) boven demo.
   * Retourneert { status, diagnostics } met diagnostics = { pathUsed, keysInFile, fileLastModified }.
   */
  readStatus() {
    const alternates = getAlternateMT5Paths()
    const candidates = []
    for (const dir of alternates) {
      const r = this.readStatusFromPath(dir)
      if (!r || !r.status) continue
      candidates.push(r)
    }
    if (candidates.length === 0 && !fs.existsSync(this.statusFile)) {
      this.writeDefaultStatus()
      const r = this.readStatusFromPath(this.mt5Path)
      if (r) candidates.push(r)
    }
    // Demo zonder balance? Vernieuw demo-bestand
    let demoRefreshed = false
    for (const r of candidates) {
      if (r.status.source === 'demo' && typeof r.status.balance !== 'number' && typeof r.status.equity !== 'number') {
        this.writeDefaultStatus()
        demoRefreshed = true
        break
      }
    }
    if (demoRefreshed) {
      const r = this.readStatusFromPath(this.mt5Path)
      if (r) candidates.push(r)
    }
    // Kies beste: eerst EA met balance, dan demo met balance, dan EA, dan demo
    let result = null
    for (const r of candidates) {
      const isEa = this.isEaStatus(r.status)
      const hasMoney = typeof r.status.balance === 'number' || typeof r.status.equity === 'number'
      if (!result) {
        result = r
        continue
      }
      const resultEa = this.isEaStatus(result.status)
      const resultMoney = typeof result.status.balance === 'number' || typeof result.status.equity === 'number'
      if (isEa && hasMoney && (!resultEa || !resultMoney)) {
        result = r
      } else if (isEa && !resultEa) {
        result = r
      } else if (hasMoney && !resultMoney) {
        result = r
      }
    }
    if (!result) return { status: null, diagnostics: null }
    const eq = result.status.equity
    const eqNum = typeof eq === 'number' ? eq : Number(eq)
    if (result.status && !Number.isNaN(eqNum)) {
      this.appendEquitySnapshot(eqNum)
    }
    return {
      status: result.status,
      diagnostics: {
        pathUsed: result.pathUsed,
        keysInFile: result.keysInFile || [],
        fileLastModified: result.mtime,
      },
    }
  }

  get equityHistoryFile() {
    return path.join(this.mt5Path, 'equity_history.json')
  }

  appendEquitySnapshot(equity) {
    try {
      const maxPoints = 500
      let points = []
      if (fs.existsSync(this.equityHistoryFile)) {
        const raw = fs.readFileSync(this.equityHistoryFile, 'utf8')
        const data = JSON.parse(raw)
        points = Array.isArray(data.points) ? data.points : []
      }
      points.push({ t: Date.now(), equity: Math.round(equity * 100) / 100 })
      if (points.length > maxPoints) points = points.slice(-maxPoints)
      fs.writeFileSync(this.equityHistoryFile, JSON.stringify({ points }, null, 0), 'utf8')
    } catch {
      // ignore
    }
  }

  readEquityHistory() {
    try {
      if (!fs.existsSync(this.equityHistoryFile)) return []
      const raw = fs.readFileSync(this.equityHistoryFile, 'utf8')
      const data = JSON.parse(raw)
      return Array.isArray(data.points) ? data.points : []
    } catch {
      return []
    }
  }

  placeOrder(order) {
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const riskAmount = order.riskAmount ?? 20
    const tp1 = order.type === 'BUY'
      ? order.entryPrice + riskAmount * 2
      : order.entryPrice - riskAmount * 2
    const tp2 = order.type === 'BUY'
      ? order.entryPrice + riskAmount * 3
      : order.entryPrice - riskAmount * 3
    const tp3 = order.type === 'BUY'
      ? order.entryPrice + riskAmount * 4
      : order.entryPrice - riskAmount * 4

    const symbol = (order.symbol === 'XAUUSD' || !order.symbol) ? getGoldSymbol() : order.symbol
    const command = {
      action: 'PLACE_ORDER',
      orderId,
      type: order.type,
      symbol,
      volume: order.volume,
      entryPrice: order.entryPrice,
      stopLoss: order.stopLoss,
      tp1: tp1.toFixed(5),
      tp2: tp2.toFixed(5),
      tp3: tp3.toFixed(5),
      timestamp: Date.now(),
    }

    try {
      fs.writeFileSync(this.commandFile, JSON.stringify(command, null, 2))
      return { success: true, orderId, message: 'Order commando geschreven' }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }
}

const bridge = new MT5Bridge()

/** Optionele .env-fallback voor accountgegevens en balance/equity. Echte EA-status overschrijft .env; demo-status niet (dan tonen we .env = live). */
function getAccountEnvOverrides() {
  const o = {}
  if (process.env.MT5_ACCOUNT) o.login = Number(process.env.MT5_ACCOUNT) || process.env.MT5_ACCOUNT
  if (process.env.MT5_SERVER) o.server = process.env.MT5_SERVER
  if (process.env.MT5_COMPANY) o.company = process.env.MT5_COMPANY
  if (process.env.MT5_MODE) o.mode = process.env.MT5_MODE
  if (process.env.MT5_BALANCE != null) {
    const b = Number(process.env.MT5_BALANCE)
    if (!Number.isNaN(b)) o.balance = b
  }
  if (process.env.MT5_EQUITY != null) {
    const e = Number(process.env.MT5_EQUITY)
    if (!Number.isNaN(e)) o.equity = e
  }
  if (process.env.MT5_PROFIT != null) {
    const p = Number(process.env.MT5_PROFIT)
    if (!Number.isNaN(p)) o.profit = p
  }
  return o
}

/** Zorg dat balance/equity/profit altijd numbers zijn (EA of JSON kan strings schrijven). */
function normalizeStatusData(data) {
  if (!data || typeof data !== 'object') return data
  const out = { ...data }
  for (const key of ['balance', 'equity', 'profit']) {
    const v = out[key]
    if (v !== undefined && v !== null) {
      const n = Number(v)
      if (!Number.isNaN(n)) out[key] = n
    }
  }
  return out
}

function getStatus(req, res) {
  try {
    const { status, diagnostics } = bridge.readStatus()
    const envOverrides = getAccountEnvOverrides()
    const raw = status ? { ...envOverrides, ...status } : { ...envOverrides }
    // Live balance uit .env heeft altijd voorrang (demo of oude EA overschrijft niet)
    if (envOverrides.balance != null) raw.balance = envOverrides.balance
    if (envOverrides.equity != null) raw.equity = envOverrides.equity
    if (envOverrides.profit != null) raw.profit = envOverrides.profit
    else if (typeof raw.equity === 'number' && typeof raw.balance === 'number') raw.profit = Number((raw.equity - raw.balance).toFixed(2))
    const data = normalizeStatusData(raw)
    res.json({
      success: true,
      data: Object.keys(data).length ? data : null,
      connected: status !== null && status.connected === true,
      path: bridge.mt5Path,
      statusFileExists: fs.existsSync(bridge.statusFile),
      bridge: {
        pathUsed: diagnostics?.pathUsed ?? bridge.mt5Path,
        keysInFile: diagnostics?.keysInFile ?? [],
        fileLastModified: diagnostics?.fileLastModified ?? null,
        fieldsWeCanFetch: [
          'connected', 'symbol', 'bid', 'ask', 'spread', 'timestamp',
          'login', 'server', 'company', 'mode', 'version',
          'balance', 'equity', 'profit', 'openPositions',
        ],
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

function getPath(req, res) {
  try {
    res.json({
      success: true,
      path: bridge.mt5Path,
      statusFile: bridge.statusFile,
      statusFileExists: fs.existsSync(bridge.statusFile),
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

function getEquityHistory(req, res) {
  try {
    const points = bridge.readEquityHistory()
    res.json({ success: true, data: points })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

function getPrice(req, res) {
  try {
    const { status } = bridge.readStatus()
    if (status && status.connected) {
      res.json({
        success: true,
        data: {
          price: (status.bid + status.ask) / 2,
          bid: status.bid,
          ask: status.ask,
          spread: status.spread,
          timestamp: (status.timestamp || 0) * 1000,
        },
      })
    } else {
      res.json({ success: false, error: 'MT5 niet verbonden' })
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

function getPositions(req, res) {
  try {
    const { status } = bridge.readStatus()
    if (status && status.openPositions) {
      res.json({
        success: true,
        data: status.openPositions.map((pos) => ({
          id: `mt5-${pos.ticket}`,
          ticket: String(pos.ticket),
          symbol: pos.symbol,
          type: pos.type,
          volume: pos.volume,
          entryPrice: pos.entryPrice,
          currentPrice: pos.currentPrice,
          profit: pos.profit,
          swap: pos.swap,
          stopLoss: pos.sl,
          takeProfit: pos.tp,
          timestamp: Date.now(),
        })),
      })
    } else {
      res.json({ success: true, data: [] })
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

function postOrder(req, res) {
  try {
    const { type, volume, entryPrice, stopLoss, symbol, riskAmount } = req.body
    if (!type || volume == null || entryPrice == null || stopLoss == null) {
      return res.status(400).json({
        success: false,
        error: 'Ontbrekende parameters (type, volume, entryPrice, stopLoss)',
      })
    }
    const result = bridge.placeOrder({
      type,
      symbol: symbol || 'XAUUSD',
      volume: Number(volume),
      entryPrice: Number(entryPrice),
      stopLoss: Number(stopLoss),
      riskAmount: riskAmount != null ? Number(riskAmount) : undefined,
    })
    res.json({ success: result.success, data: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

module.exports = {
  bridge,
  getStatus,
  getPath,
  getEquityHistory,
  getPrice,
  getPositions,
  postOrder,
}
