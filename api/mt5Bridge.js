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

/** Alternatieve paden waar de EA (FILE_COMMON) status.json kan schrijven. */
function getAlternateMT5Paths() {
  const primary = getMT5Path()
  const candidates = [primary]
  const base = path.join(os.homedir(), '.wine', 'drive_c', 'Users', 'Public', 'Documents')
  candidates.push(path.join(base, 'MetaQuotes', 'Terminal', 'Common', 'Files', 'MT5_AI_Bot'))
  candidates.push(path.join(base, 'MT5_AI_Bot'))
  return [...new Set(candidates)]
}

const MAC_WINE_MT5_BASE =
  process.platform === 'darwin'
    ? path.join(
        os.homedir(),
        'Library',
        'Application Support',
        'net.metaquotes.wine.metatrader5',
        'drive_c',
        'Program Files',
        'MetaTrader 5'
      )
    : null

/**
 * Mac/Wine: FILE_COMMON wijst soms naar MQL5/Files/Common (onder Program Files).
 * Error 5004 = file not found → EA zoekt hier. Schrijf commands.json ook naar deze map.
 */
function getMacWineMQL5CommonBotPath() {
  if (!MAC_WINE_MT5_BASE) return null
  return path.join(MAC_WINE_MT5_BASE, 'MQL5', 'Files', 'Common', 'MT5_AI_Bot')
}

/**
 * Mac/Wine: sommige builds gebruiken MQL5/Files (zonder Common) voor FILE_COMMON.
 * Schrijf commands.json ook hier zodat de EA het vindt.
 */
function getMacWineMQL5FilesBotPath() {
  if (!MAC_WINE_MT5_BASE) return null
  return path.join(MAC_WINE_MT5_BASE, 'MQL5', 'Files', 'MT5_AI_Bot')
}

/** Alle Mac/Wine paden waar de EA mogelijk zoekt (FILE_COMMON kan per build verschillen). */
function getMacWineBotPaths() {
  const paths = []
  const common = getMacWineMQL5CommonBotPath()
  const files = getMacWineMQL5FilesBotPath()
  if (common) paths.push(common)
  if (files) paths.push(files)
  return paths
}

/** Mac/Wine: root van FILE_COMMON (Terminal/Common/Files). EA-fallback leest FileOpen("commands.json") daar. */
function getMacWineFileCommonRootPaths() {
  if (process.platform !== 'darwin') return []
  const base = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'net.metaquotes.wine.metatrader5',
    'drive_c'
  )
  return [
    path.join(base, 'users', 'user', 'AppData', 'Roaming', 'MetaQuotes', 'Terminal', 'Common', 'Files'),
    path.join(base, 'users', 'Public', 'AppData', 'Roaming', 'MetaQuotes', 'Terminal', 'Common', 'Files'),
    path.join(base, 'users', 'default', 'AppData', 'Roaming', 'MetaQuotes', 'Terminal', 'Common', 'Files'),
  ]
}

/**
 * Oude aittrader-conventie: EA gebruikt FilePath "C:/Users/Public/Documents/MT5_AI_Bot/".
 * Optie A: FILE_COMMON + C: = submap onder Common\Files → Common\Files\C\Users\...\MT5_AI_Bot
 * Optie B: FILE_COMMON + C: = virtuele C:-drive → drive_c\Users\Public\Documents\MT5_AI_Bot
 * Beide paden worden beschreven.
 */
function getMacWineCPathBotDirs() {
  if (process.platform !== 'darwin') return []
  const base = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'net.metaquotes.wine.metatrader5',
    'drive_c'
  )
  const underCommon = path.join('MetaQuotes', 'Terminal', 'Common', 'Files', 'C', 'Users', 'Public', 'Documents', 'MT5_AI_Bot')
  const dirs = [
    path.join(base, 'users', 'user', 'AppData', 'Roaming', underCommon),
    path.join(base, 'users', 'Public', 'AppData', 'Roaming', underCommon),
    path.join(base, 'users', 'default', 'AppData', 'Roaming', underCommon),
  ]
  return dirs
}

/** Virtuele C:-drive: C:\Users\Public\Documents\MT5_AI_Bot. Op Mac Wine: drive_c/users/Public/Documents/MT5_AI_Bot (kleine users). */
function getMacWineDriveCBotDirs() {
  if (process.platform !== 'darwin') return []
  const base = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'net.metaquotes.wine.metatrader5',
    'drive_c'
  )
  return [
    path.join(base, 'users', 'Public', 'Documents', 'MT5_AI_Bot'),
    path.join(base, 'users', 'user', 'Documents', 'MT5_AI_Bot'),
  ]
}

/**
 * Met FILE_COMMON is het pad relatief t.o.v. Terminal Common\Files.
 * EA met BotFilePath "C:/Users/Public/Documents/MT5_AI_Bot/" zoekt dus naar
 * Common\Files\C\Users\Public\Documents\MT5_AI_Bot\commands.json
 */
function getFileCommonCommandPaths() {
  const bases = [
    path.join(os.homedir(), '.wine', 'drive_c', 'Users', 'Public', 'Documents', 'MetaQuotes', 'Terminal', 'Common', 'Files'),
    path.join(os.homedir(), '.wine', 'drive_c', 'Users', 'Public', 'AppData', 'Roaming', 'MetaQuotes', 'Terminal', 'Common', 'Files'),
    path.join(os.homedir(), '.wine', 'drive_c', 'users', 'Public', 'AppData', 'Roaming', 'MetaQuotes', 'Terminal', 'Common', 'Files'),
  ]
  if (process.env.MT5_COMMON_FILES) {
    bases.unshift(process.env.MT5_COMMON_FILES)
  }
  return bases.map((b) => path.join(b, 'C', 'Users', 'Public', 'Documents', 'MT5_AI_Bot', 'commands.json'))
}

/** Pad naar bridge-logfile (zelfde map als status.json). */
function getBridgeLogPath() {
  const p = getMT5Path()
  return path.join(p, 'bridge.log')
}

/** Schrijf regel naar bridge.log (timestamp + msg) om connectie te kunnen testen. */
function bridgeLog(msg) {
  const line = `${new Date().toISOString()} ${msg}\n`
  const targets = [getBridgeLogPath()]
  for (const dir of getMacWineBotPaths()) {
    targets.push(path.join(dir, 'bridge.log'))
  }
  for (const logPath of targets) {
    try {
      const dir = path.dirname(logPath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.appendFileSync(logPath, line, 'utf8')
    } catch {
      // negeer
    }
  }
}

class MT5Bridge {
  constructor() {
    this.mt5Path = getMT5Path()
    this.commandFile = path.join(this.mt5Path, 'commands.json')
    this.responseFile = path.join(this.mt5Path, 'responses.json')
    this.statusFile = path.join(this.mt5Path, 'status.json')
    this.requestFile = path.join(this.mt5Path, 'mt5_request.txt')
    this.responseTxtFile = path.join(this.mt5Path, 'mt5_response.txt')
    this.ensureDirectory()
  }

  /**
   * Vraag candles op bij de EA (file-based: mt5_request.txt / mt5_response.txt).
   * Retourneert { candles: [{ time, open, high, low, close, volume }] } of null.
   */
  async getCandles(symbol, timeframe, count) {
    const reqLine = `GET /candles/${symbol || 'XAUUSD'}/${timeframe || 'H1'}/${count || 48}\n`
    try {
      fs.writeFileSync(this.requestFile, reqLine, 'utf8')
    } catch {
      return null
    }
    const deadline = Date.now() + 5000
    const pollMs = 300
    let lastSize = -1
    while (Date.now() < deadline) {
      try {
        if (!fs.existsSync(this.responseTxtFile)) {
          await new Promise((r) => setTimeout(r, pollMs))
          continue
        }
        const stat = fs.statSync(this.responseTxtFile)
        const size = stat.size
        if (size > 0 && size !== lastSize) {
          lastSize = size
          const content = fs.readFileSync(this.responseTxtFile, 'utf8')
          const json = JSON.parse(content)
          if (json.error) return null
          if (json.candles && Array.isArray(json.candles)) return json
        }
      } catch {
        // nog geen geldige response
      }
      await new Promise((r) => setTimeout(r, pollMs))
    }
    return null
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
   * Inclusief Mac/Wine MQL5/Files/Common (FILE_COMMON) voor live posities.
   * Retourneert { status, diagnostics } met diagnostics = { pathUsed, keysInFile, fileLastModified }.
   */
  readStatus() {
    const alternates = [this.mt5Path, ...getMacWineBotPaths()]
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
    if (!result) {
      bridgeLog('readStatus: geen status gevonden (geen geldig status.json op geen van de paden)')
      return { status: null, diagnostics: null }
    }
    const eq = result.status.equity
    const eqNum = typeof eq === 'number' ? eq : Number(eq)
    if (result.status && !Number.isNaN(eqNum)) {
      this.appendEquitySnapshot(eqNum)
    }
    const posCount = Array.isArray(result.status.openPositions) ? result.status.openPositions.length : 0
    bridgeLog(`readStatus: OK path=${result.pathUsed} openPositions=${posCount} bid=${result.status.bid ?? '-'} ask=${result.status.ask ?? '-'}`)
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
    let tp1 = order.tp1 != null ? Number(order.tp1) : null
    let tp2 = order.tp2 != null ? Number(order.tp2) : null
    let tp3 = order.tp3 != null ? Number(order.tp3) : null
    if (tp1 == null || tp2 == null || tp3 == null) {
      tp1 = order.type === 'BUY'
        ? order.entryPrice + riskAmount * 2
        : order.entryPrice - riskAmount * 2
      tp2 = order.type === 'BUY'
        ? order.entryPrice + riskAmount * 3
        : order.entryPrice - riskAmount * 3
      tp3 = order.type === 'BUY'
        ? order.entryPrice + riskAmount * 4
        : order.entryPrice - riskAmount * 4
    }

    const symbol = (order.symbol === 'XAUUSD' || !order.symbol) ? getGoldSymbol() : order.symbol
    const command = {
      action: 'PLACE_ORDER',
      orderId,
      type: order.type,
      symbol,
      volume: order.volume,
      entryPrice: order.entryPrice,
      stopLoss: order.stopLoss,
      tp1: Number(tp1).toFixed(5),
      tp2: Number(tp2).toFixed(5),
      tp3: Number(tp3).toFixed(5),
      timestamp: Date.now(),
    }

    const commandStr = JSON.stringify(command, null, 2)
    try {
      const pathsWritten = []
      fs.writeFileSync(this.commandFile, commandStr)
      pathsWritten.push(this.mt5Path)
      // 5004 = file not found: FILE_COMMON kan per MT5-sessie anders wijzen. Schrijf naar alle mogelijke paden.
      for (const dir of getMacWineBotPaths()) {
        try {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(path.join(dir, 'commands.json'), commandStr)
          pathsWritten.push(dir)
        } catch {
          // negeer
        }
      }
      // EA-fallback: FileOpen("commands.json", FILE_COMMON) leest uit root van FILE_COMMON
      for (const commonRoot of getMacWineFileCommonRootPaths()) {
        try {
          if (!fs.existsSync(commonRoot)) fs.mkdirSync(commonRoot, { recursive: true })
          fs.writeFileSync(path.join(commonRoot, 'commands.json'), commandStr)
          pathsWritten.push(commonRoot + ' (root)')
        } catch {
          // negeer
        }
      }
      // H1: Oude aittrader: EA FilePath "C:/Users/Public/Documents/MT5_AI_Bot/" → Common\Files\C\Users\... of virtuele C:
      for (const dir of getMacWineCPathBotDirs()) {
        try {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(path.join(dir, 'commands.json'), commandStr)
          pathsWritten.push(dir + ' (C: under Common)')
        } catch {
          // negeer
        }
      }
      for (const dir of getMacWineDriveCBotDirs()) {
        try {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(path.join(dir, 'commands.json'), commandStr)
          pathsWritten.push(dir + ' (C: drive)')
        } catch {
          // negeer
        }
      }
      bridgeLog(`placeOrder: written orderId=${orderId} type=${order.type} symbol=${symbol} volume=${order.volume} paths=${pathsWritten.length}`)
      // #region agent log
      const allDirs = [this.mt5Path, ...getMacWineBotPaths(), ...getMacWineFileCommonRootPaths(), ...getMacWineCPathBotDirs()]
      const existence = allDirs.map((d) => ({ dir: d, cmdPath: path.join(d, 'commands.json'), exists: fs.existsSync(path.join(d, 'commands.json')) }))
      fetch('http://127.0.0.1:7244/ingest/a8b5dd67-6fd0-4e9c-a85f-a5933fd1230e', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'mt5Bridge.js:placeOrder', message: 'placeOrder paths and existence', data: { orderId, mt5Path: this.mt5Path, pathsWritten: pathsWritten.length, existence }, timestamp: Date.now(), hypothesisId: 'H2,H4,H5' }) }).catch(() => {})
      // #endregion
      return { success: true, orderId, message: 'Order commando geschreven' }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  /**
   * Poll voor responses.json met matching orderId (EA schrijft dit na verwerking).
   * Retourneert Promise<{ success, message } | null> bij timeout.
   */
  waitForResponse(orderId, timeoutMs = 15000) {
    const pollMs = 300
    const responsePaths = [this.responseFile]
    for (const dir of getMacWineBotPaths()) {
      responsePaths.push(path.join(dir, 'responses.json'))
    }
    for (const d of getMacWineCPathBotDirs()) responsePaths.push(path.join(d, 'responses.json'))
    for (const d of getMacWineDriveCBotDirs()) responsePaths.push(path.join(d, 'responses.json'))
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/a8b5dd67-6fd0-4e9c-a85f-a5933fd1230e', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'mt5Bridge.js:waitForResponse', message: 'waitForResponse started', data: { orderId, responsePaths, responseFileExists: responsePaths.map((p) => ({ p, exists: fs.existsSync(p) })) }, timestamp: Date.now(), hypothesisId: 'H3' }) }).catch(() => {})
    // #endregion
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs
      const interval = setInterval(() => {
        if (Date.now() > deadline) {
          clearInterval(interval)
          bridgeLog(`waitForResponse: timeout orderId=${orderId} (geen response van EA binnen ${timeoutMs}ms)`)
          // #region agent log
          const existsAtTimeout = responsePaths.map((p) => ({ p, exists: fs.existsSync(p) }))
          fetch('http://127.0.0.1:7244/ingest/a8b5dd67-6fd0-4e9c-a85f-a5933fd1230e', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'mt5Bridge.js:waitForResponse', message: 'waitForResponse timeout', data: { orderId, existsAtTimeout }, timestamp: Date.now(), hypothesisId: 'H3,H5' }) }).catch(() => {})
          // #endregion
          resolve(null)
          return
        }
        for (const responsePath of responsePaths) {
          try {
            if (!fs.existsSync(responsePath)) continue
            const content = fs.readFileSync(responsePath, 'utf8')
            const data = JSON.parse(content)
            if (data.orderId === orderId) {
              clearInterval(interval)
              try { fs.unlinkSync(responsePath) } catch { /* ignore */ }
              bridgeLog(`waitForResponse: OK orderId=${orderId} success=${!!data.success} message=${(data.message || '').slice(0, 80)}`)
              resolve({ success: !!data.success, message: data.message || '' })
              return
            }
          } catch {
            // nog geen geldige response of parse error
          }
        }
      }, pollMs)
    })
  }

  /**
   * Schrijf order en wacht op EA-response. Retourneert Promise met resultaat van EA of timeout.
   */
  async placeOrderAndWait(order, timeoutMs = 15000) {
    const writeResult = this.placeOrder(order)
    if (!writeResult.success) return writeResult
    const response = await this.waitForResponse(writeResult.orderId, timeoutMs)
    if (response === null) {
      return {
        success: false,
        orderId: writeResult.orderId,
        message: 'Geen response van EA (timeout). Controleer of AITradingBot.mq5 draait en FilePath klopt.',
      }
    }
    return {
      success: response.success,
      orderId: writeResult.orderId,
      message: response.message,
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
        logFile: getBridgeLogPath(),
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

/** GET /api/mt5/log – inhoud van bridge.log (terminal log voor dashboard). */
function getBridgeLog(req, res) {
  try {
    const logPath = getBridgeLogPath()
    const maxLines = Math.min(parseInt(req.query.lines, 10) || 500, 2000)
    let content = ''
    if (fs.existsSync(logPath)) {
      const raw = fs.readFileSync(logPath, 'utf8')
      const lines = raw.split('\n').filter(Boolean)
      const slice = lines.length > maxLines ? lines.slice(-maxLines) : lines
      content = slice.join('\n')
    }
    res.json({
      success: true,
      data: {
        content,
        path: logPath,
        empty: !content,
      },
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

async function postOrder(req, res) {
  try {
    const { type, volume, entryPrice, stopLoss, symbol, riskAmount, tp1, tp2, tp3 } = req.body
    if (!type || volume == null || entryPrice == null || stopLoss == null) {
      return res.status(400).json({
        success: false,
        error: 'Ontbrekende parameters (type, volume, entryPrice, stopLoss)',
      })
    }
    const result = await bridge.placeOrderAndWait({
      type,
      symbol: symbol || 'XAUUSD',
      volume: Number(volume),
      entryPrice: Number(entryPrice),
      stopLoss: Number(stopLoss),
      riskAmount: riskAmount != null ? Number(riskAmount) : undefined,
      tp1: tp1 != null ? Number(tp1) : undefined,
      tp2: tp2 != null ? Number(tp2) : undefined,
      tp3: tp3 != null ? Number(tp3) : undefined,
    }, 15000)
    res.json({ success: result.success, data: result, error: result.success ? undefined : result.message })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

module.exports = {
  bridge,
  getGoldSymbol,
  getStatus,
  getPath,
  getBridgeLog,
  getEquityHistory,
  getPrice,
  getPositions,
  postOrder,
}
