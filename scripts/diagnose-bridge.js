/**
 * Diagnose: stap-voor-stap controleren of de MT5-bridge en EA correct verbonden zijn.
 * Run: node scripts/diagnose-bridge.js
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const os = require('os')

const homedir = os.homedir()
const wineBase = path.join(homedir, '.wine', 'drive_c', 'Users', 'Public', 'Documents')
const mt5PathEnv = process.env.MT5_BOT_PATH
const mt5Path = mt5PathEnv || path.join(wineBase, 'MT5_AI_Bot')

// Mogelijke Common path (waar EA met FILE_COMMON naartoe schrijft)
const commonCandidates = [
  path.join(wineBase, 'MetaQuotes', 'Terminal', 'Common', 'Files', 'MT5_AI_Bot'),
  path.join(homedir, '.wine', 'drive_c', 'users', 'Public', 'AppData', 'Roaming', 'MetaQuotes', 'Terminal', 'Common', 'Files', 'MT5_AI_Bot'),
  path.join(homedir, '.wine', 'drive_c', 'users', 'default', 'AppData', 'Roaming', 'MetaQuotes', 'Terminal', 'Common', 'Files', 'MT5_AI_Bot'),
]

console.log('=== Stap 1: Bridge-pad ===')
console.log('MT5_BOT_PATH (env):', mt5PathEnv || '(niet gezet, gebruik default)')
console.log('Gebruikt pad:', mt5Path)
console.log('Map bestaat:', fs.existsSync(mt5Path) ? 'JA' : 'NEE')
if (!fs.existsSync(mt5Path)) {
  try {
    fs.mkdirSync(mt5Path, { recursive: true })
    console.log('Map aangemaakt.')
  } catch (e) {
    console.log('Fout bij aanmaken:', e.message)
  }
}

console.log('\n=== Stap 2: Bestanden in bridge-map ===')
const commandFile = path.join(mt5Path, 'commands.json')
const responseFile = path.join(mt5Path, 'responses.json')
const statusFile = path.join(mt5Path, 'status.json')
for (const f of [commandFile, responseFile, statusFile]) {
  const exists = fs.existsSync(f)
  console.log(path.basename(f) + ':', exists ? 'bestaat' : 'ontbreekt')
  if (exists && f === statusFile) {
    try {
      const content = fs.readFileSync(f, 'utf8')
      const data = JSON.parse(content)
      console.log('  -> connected:', data.connected, 'symbol:', data.symbol, 'bid:', data.bid)
    } catch (e) {
      console.log('  -> kon niet parsen:', e.message)
    }
  }
}

console.log('\n=== Stap 3: MT5 Common-paden (EA met FILE_COMMON) ===')
for (const p of commonCandidates) {
  const exists = fs.existsSync(p)
  console.log(p.replace(homedir, '~') + ':', exists ? 'bestaat' : 'ontbreekt')
  if (exists) {
    const cf = path.join(p, 'commands.json')
    const sf = path.join(p, 'status.json')
    console.log('  commands.json:', fs.existsSync(cf) ? 'ja' : 'nee', '| status.json:', fs.existsSync(sf) ? 'ja' : 'nee')
  }
}

console.log('\n=== Stap 4: Test-command schrijven ===')
const { bridge } = require('../api/mt5Bridge')
const result = bridge.placeOrder({
  type: 'BUY',
  symbol: process.env.MT5_SYMBOL_GOLD || 'XAUUSD',
  volume: 0.01,
  entryPrice: 2650,
  stopLoss: 2635,
  tp1: 2660,
  tp2: 2670,
  tp3: 2680,
})
console.log('placeOrder result:', result.success ? 'OK' : result.message)
if (result.success) {
  console.log('orderId:', result.orderId)
  const content = fs.readFileSync(commandFile, 'utf8')
  console.log('Inhoud commands.json (eerste 400 tekens):')
  console.log(content.slice(0, 400))
}

console.log('\n=== Stap 5: Ook naar Common schrijven (als map bestaat) ===')
let writtenToCommon = false
for (const commonPath of commonCandidates) {
  if (!fs.existsSync(commonPath)) continue
  try {
    const commonCommand = path.join(commonPath, 'commands.json')
    if (fs.existsSync(commandFile)) {
      fs.copyFileSync(commandFile, commonCommand)
      console.log('Gekopieerd naar:', commonPath.replace(homedir, '~'))
      writtenToCommon = true
    }
  } catch (e) {
    console.log('Fout bij kopiëren naar', commonPath, ':', e.message)
  }
}
if (!writtenToCommon) {
  console.log('Geen Common-map gevonden; EA leest mogelijk alleen uit MT5_BOT_PATH.')
  console.log('Zorg dat in MT5: EA BotFilePath = exact de map waar de app naartoe schrijft.')
  console.log('Of: maak map MT5_AI_Bot in Terminal/Common/Files en zet MT5_BOT_PATH daarnaar.')
}

console.log('\n=== Conclusie ===')
if (fs.existsSync(statusFile)) {
  console.log('status.json bestaat met live data → er schrijft een EA naar deze map.')
  console.log('Voor ORDERS moet AITradingBot.mq5 op een chart staan (leest commands.json, plaatst orders, schrijft responses.json en status.json).')
}
console.log('Als commands.json na een test blijft staan: zet AITradingBot.mq5 op een XAUUSD/GOLD-chart, AutoTrading AAN, BotFilePath = C:/Users/Public/Documents/MT5_AI_Bot/')
