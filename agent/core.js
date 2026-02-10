/**
 * Agent-kern: leest status, stuurt naar API, haalt commands op, schrijft commands.json, stuurt response.
 * Gebruikt door agent/index.js (CLI) en door de Electron-app.
 */
const fs = require('fs')
const path = require('path')

const STATUS_INTERVAL_MS = 2000
const COMMAND_POLL_MS = 1500
const RESPONSE_WAIT_MS = 20000

function runAgent(config) {
  const { API_URL: baseUrl, AGENT_TOKEN: token, MT5_BOT_PATH: botPath } = config
  const API_URL = (baseUrl || 'https://www.aitrading.software').replace(/\/$/, '')

  if (!token || !botPath) {
    throw new Error('AGENT_TOKEN en MT5_BOT_PATH zijn verplicht.')
  }

  const statusFile = path.join(botPath, 'status.json')
  const commandFile = path.join(botPath, 'commands.json')
  const responseFile = path.join(botPath, 'responses.json')

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  async function fetchApi(method, apiPath, body) {
    const url = `${API_URL}${apiPath}`
    const opt = { method, headers }
    if (body) opt.body = JSON.stringify(body)
    const res = await fetch(url, opt)
    const text = await res.text()
    let json
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      throw new Error(`API ${apiPath}: ongeldig antwoord`)
    }
    if (!res.ok) {
      throw new Error(json.error || json.message || `HTTP ${res.status}`)
    }
    return json
  }

  function readStatus() {
    try {
      if (!fs.existsSync(statusFile)) return null
      const raw = fs.readFileSync(statusFile, 'utf8')
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  function writeCommand(command) {
    fs.writeFileSync(commandFile, JSON.stringify(command, null, 2), 'utf8')
  }

  function waitForResponse(orderId, timeoutMs) {
    const deadline = Date.now() + timeoutMs
    const pollMs = 300
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (Date.now() > deadline) {
          clearInterval(interval)
          resolve(null)
          return
        }
        try {
          if (!fs.existsSync(responseFile)) return
          const raw = fs.readFileSync(responseFile, 'utf8')
          const data = JSON.parse(raw)
          if (data.orderId === orderId) {
            clearInterval(interval)
            try { fs.unlinkSync(responseFile) } catch {}
            resolve(data)
          }
        } catch {
          // negeer
        }
      }, pollMs)
    })
  }

  async function pushStatus() {
    const status = readStatus()
    if (!status) return
    try {
      await fetchApi('POST', '/api/mt5/agent/status', status)
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) console.warn('Status push mislukt:', err.message)
    }
  }

  async function processCommands() {
    let json
    try {
      json = await fetchApi('GET', '/api/mt5/agent/commands')
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) console.warn('Commands ophalen mislukt:', err.message)
      return
    }
    if (!json.success || !json.data || !json.data.command) return
    const { orderId, command } = json.data
    try {
      writeCommand(command)
      const response = await waitForResponse(orderId, RESPONSE_WAIT_MS)
      await fetchApi('POST', '/api/mt5/agent/response', {
        orderId,
        success: response ? response.success === true : false,
        message: response ? response.message : 'Timeout: geen response van EA',
      })
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) console.warn('Response doorsturen mislukt:', err.message)
      try {
        await fetchApi('POST', '/api/mt5/agent/response', {
          orderId,
          success: false,
          message: err.message,
        })
      } catch {}
    }
  }

  if (!fs.existsSync(botPath)) {
    throw new Error(`MT5_BOT_PATH bestaat niet: ${botPath}`)
  }

  const t1 = setInterval(pushStatus, STATUS_INTERVAL_MS)
  const t2 = setInterval(processCommands, COMMAND_POLL_MS)
  pushStatus()
  processCommands()

  return {
    stop() {
      clearInterval(t1)
      clearInterval(t2)
    },
  }
}

module.exports = { runAgent }
