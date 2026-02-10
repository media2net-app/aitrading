#!/usr/bin/env node
/**
 * Local agent (CLI): koppelt de MT5_AI_Bot-map aan de live API (www.aitrading.software).
 * Zie agent/core.js voor de logica; die wordt ook gebruikt door de Electron-app.
 */
const path = require('path')

// Als standalone .exe/.app: .env naast het programma; anders naast index.js
const configDir = typeof process.pkg !== 'undefined' ? path.dirname(process.execPath) : __dirname
require('dotenv').config({ path: path.join(configDir, '.env') })

const API_URL = process.env.API_URL || 'https://www.aitrading.software'
const AGENT_TOKEN = process.env.AGENT_TOKEN
const MT5_BOT_PATH = process.env.MT5_BOT_PATH

const { runAgent } = require('./core.js')

if (!AGENT_TOKEN) {
  console.error('AGENT_TOKEN is verplicht. Genereer een token op de Downloads-pagina en zet het in .env of als omgevingsvariabele.')
  process.exit(1)
}
if (!MT5_BOT_PATH) {
  console.error('MT5_BOT_PATH is verplicht. Vul het volledige pad naar je MT5_AI_Bot-map in (zie Downloads-pagina voor uitleg).')
  process.exit(1)
}

try {
  runAgent({ API_URL, AGENT_TOKEN, MT5_BOT_PATH })
  console.log('Agent gestart. API:', API_URL.replace(/\/$/, ''), '| MT5-map:', MT5_BOT_PATH)
  console.log('Druk Ctrl+C om te stoppen.')
} catch (err) {
  console.error(err.message)
  process.exit(1)
}
