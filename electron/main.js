const { app, Tray, Menu, BrowserWindow, nativeImage, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const TRAY_ICON_FALLBACK = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQzwAE/weqQwABFwAAAABJRU5ErkJggg==')

function getConfigDir() {
  if (!app.isPackaged) return __dirname
  if (process.platform === 'darwin') return app.getPath('userData')
  return path.dirname(process.execPath)
}
const configDir = getConfigDir()
const envPath = path.join(configDir, '.env')

function loadEnv() {
  require('dotenv').config({ path: envPath })
}
loadEnv()

let API_URL = (process.env.API_URL || 'https://www.aitrading.software').replace(/\/$/, '')
let AGENT_TOKEN = process.env.AGENT_TOKEN
let MT5_BOT_PATH = process.env.MT5_BOT_PATH

let tray = null
let agentHandle = null
let win = null
let statusInterval = null

function loadAgentCore() {
  const corePath = app.isPackaged
    ? path.join(process.resourcesPath, 'agent', 'core.js')
    : path.join(__dirname, '..', 'agent', 'core.js')
  return require(corePath)
}

function startAgent() {
  if (!AGENT_TOKEN || !MT5_BOT_PATH) {
    if (tray) tray.setToolTip('AITrading Agent: config ontbreekt')
    return false
  }
  try {
    if (agentHandle && agentHandle.stop) agentHandle.stop()
    const { runAgent } = loadAgentCore()
    agentHandle = runAgent({ API_URL, AGENT_TOKEN, MT5_BOT_PATH })
    if (tray) tray.setToolTip('AITrading Agent actief – verbonden met ' + API_URL)
    return true
  } catch (err) {
    if (tray) tray.setToolTip('AITrading Agent: ' + (err.message || 'fout'))
    return false
  }
}

function readStatusFromFile() {
  if (!MT5_BOT_PATH) return null
  const statusFile = path.join(MT5_BOT_PATH, 'status.json')
  try {
    if (!fs.existsSync(statusFile)) return null
    const raw = fs.readFileSync(statusFile, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function startStatusPolling() {
  if (statusInterval) clearInterval(statusInterval)
  statusInterval = setInterval(() => {
    if (!win || win.isDestroyed()) return
    const status = readStatusFromFile()
    win.webContents.send('status-update', status)
  }, 1500)
  // direct één keer
  if (win && !win.isDestroyed()) win.webContents.send('status-update', readStatusFromFile())
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png')
  const icon = fs.existsSync(iconPath) ? iconPath : undefined
  tray = new Tray(icon || TRAY_ICON_FALLBACK)
  tray.setToolTip('AITrading Agent')
  updateTrayMenu()
  tray.on('click', () => showWindow())
}

function updateTrayMenu() {
  if (!tray) return
  const connected = !!(AGENT_TOKEN && MT5_BOT_PATH && agentHandle)
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: connected ? 'Agent actief – ' + API_URL : 'Config ontbreekt – open de app', enabled: false },
      { type: 'separator' },
      { label: 'Dashboard openen', click: () => showWindow() },
      { label: 'Afsluiten', click: () => app.quit() },
    ])
  )
}

function showWindow() {
  if (win) {
    win.show()
    win.focus()
    return
  }
  win = new BrowserWindow({
    width: 920,
    height: 700,
    minWidth: 640,
    minHeight: 480,
    show: false,
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  win.on('closed', () => {
    win = null
    if (statusInterval) {
      clearInterval(statusInterval)
      statusInterval = null
    }
  })
  win.loadFile(path.join(__dirname, 'dashboard.html'))
  win.once('ready-to-show', () => {
    win.show()
    win.maximize()
    startStatusPolling()
  })
}

// IPC
ipcMain.handle('get-config', () => {
  const tokenSet = !!AGENT_TOKEN
  const tokenMasked = tokenSet ? '••••••••' + (AGENT_TOKEN.slice(-4)) : ''
  return {
    configDir,
    apiUrl: API_URL,
    agentTokenMasked: tokenMasked,
    tokenSet,
    mt5Path: MT5_BOT_PATH || '',
  }
})

ipcMain.handle('save-config', async (_, { apiUrl, agentToken, mt5Path }) => {
  const token = (agentToken && agentToken.trim()) ? agentToken.trim() : (AGENT_TOKEN || '')
  const content = [
    'API_URL=' + (apiUrl || 'https://www.aitrading.software').trim(),
    'AGENT_TOKEN=' + token,
    'MT5_BOT_PATH=' + (mt5Path || '').trim(),
  ].join('\n')
  fs.writeFileSync(envPath, content, 'utf8')
  loadEnv()
  API_URL = (process.env.API_URL || 'https://www.aitrading.software').replace(/\/$/, '')
  AGENT_TOKEN = process.env.AGENT_TOKEN
  MT5_BOT_PATH = process.env.MT5_BOT_PATH
  startAgent()
  updateTrayMenu()
  startStatusPolling()
  return { ok: true }
})

ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win || null, {
    properties: ['openDirectory'],
    title: 'Selecteer de MT5_AI_Bot-map',
  })
  if (canceled || !filePaths.length) return null
  return filePaths[0]
})

app.whenReady().then(() => {
  createTray()
  startAgent()
  updateTrayMenu()
  showWindow()
})

app.on('window-all-closed', () => {})
app.on('before-quit', () => {
  if (statusInterval) clearInterval(statusInterval)
  if (agentHandle && agentHandle.stop) agentHandle.stop()
})
