/**
 * Agent bridge: status en command queue per user (voor local agent ↔ live API).
 * - Agent POST status → opgeslagen per userId; GET /api/mt5/status met auth kan dit teruggeven.
 * - Webapp POST order met auth → command in queue; agent GET commands → krijgt en verwijdert; agent POST response → opgeslagen voor polling.
 * - Agent kan authenticeren met JWT (sessie) of met een langlevend agent-token (Bearer).
 */

const crypto = require('crypto')
const auth = require('./auth')
const { getPrisma, hasDatabase } = require('./db')

function hashAgentToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

/** Resolve Bearer token naar userId: eerst JWT, anders agent-token lookup in DB. */
async function resolveUserIdFromToken(token) {
  if (!token) return null
  const payload = auth.verifyToken(token)
  if (payload) return payload.userId
  if (!hasDatabase()) return null
  const hash = hashAgentToken(token)
  const prisma = getPrisma()
  const user = await prisma.user.findFirst({
    where: { agentTokenHash: hash },
    select: { id: true },
  })
  return user ? user.id : null
}

// In-memory: laatste status per userId (agent pusht periodiek)
const agentStatusByUserId = new Map()

// Per user: queue van { orderId, command, createdAt }
const commandQueueByUserId = new Map()

// orderId → { success, message, timestamp } (na agent POST response)
const responseByOrderId = new Map()

const MAX_RESPONSE_AGE_MS = 5 * 60 * 1000 // 5 min

async function getUserIdFromReqAsync(req) {
  const token = auth.getBearerToken(req)
  if (!token) return null
  return resolveUserIdFromToken(token)
}

/** Synchrone variant voor bestaande code die geen async kan: probeert alleen JWT. */
function getUserIdFromReq(req) {
  const token = auth.getBearerToken(req)
  if (!token) return null
  const payload = auth.verifyToken(token)
  return payload ? payload.userId : null
}

function pushStatus(userId, data) {
  agentStatusByUserId.set(userId, {
    data: data || null,
    connected: data && data.connected === true,
    path: null,
    bridge: null,
    updatedAt: Date.now(),
  })
}

function getStatusForUser(userId) {
  const stored = agentStatusByUserId.get(userId)
  if (!stored) return null
  return {
    success: true,
    data: stored.data,
    connected: stored.connected,
    path: stored.path,
    statusFileExists: true,
    bridge: stored.bridge,
    source: 'agent',
  }
}

function addCommand(userId, command) {
  const orderId = command && command.orderId ? command.orderId : `agent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  if (!commandQueueByUserId.has(userId)) commandQueueByUserId.set(userId, [])
  commandQueueByUserId.get(userId).push({ orderId, command, createdAt: Date.now() })
  return orderId
}

function getNextCommand(userId) {
  const queue = commandQueueByUserId.get(userId)
  if (!queue || queue.length === 0) return null
  return queue.shift()
}

function setResponse(orderId, success, message) {
  responseByOrderId.set(orderId, { success, message, timestamp: Date.now() })
}

function getResponse(orderId) {
  const r = responseByOrderId.get(orderId)
  if (!r) return null
  if (Date.now() - r.timestamp > MAX_RESPONSE_AGE_MS) {
    responseByOrderId.delete(orderId)
    return null
  }
  return r
}

/** POST /api/mt5/agent/status – agent stuurt status.json body */
async function postAgentStatus(req, res) {
  const userId = await getUserIdFromReqAsync(req)
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Autorisatie vereist' })
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    pushStatus(userId, body)
    res.json({ success: true, message: 'Status ontvangen' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

/** GET /api/mt5/agent/commands – agent haalt volgende pending command op */
async function getAgentCommands(req, res) {
  const userId = await getUserIdFromReqAsync(req)
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Autorisatie vereist' })
  }
  try {
    const item = getNextCommand(userId)
    if (!item) {
      return res.json({ success: true, data: null })
    }
    res.json({ success: true, data: { orderId: item.orderId, command: item.command } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

/** POST /api/mt5/agent/response – agent stuurt resultaat van uitgevoerde order */
async function postAgentResponse(req, res) {
  const userId = await getUserIdFromReqAsync(req)
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Autorisatie vereist' })
  }
  try {
    const { orderId, success, message } = req.body || {}
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId verplicht' })
    }
    setResponse(orderId, !!success, message || '')
    res.json({ success: true, message: 'Response ontvangen' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

/** GET /api/mt5/agent/order-status/:orderId – webapp pollt voor resultaat van geplaatste order */
async function getAgentOrderStatus(req, res) {
  const userId = await getUserIdFromReqAsync(req)
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Autorisatie vereist' })
  }
  try {
    const orderId = req.params.orderId
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId verplicht' })
    }
    const r = getResponse(orderId)
    if (!r) {
      return res.json({ success: true, data: { status: 'pending' } })
    }
    res.json({
      success: true,
      data: { status: 'completed', success: r.success, message: r.message },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

/** Bouw command object in het formaat dat de EA (commands.json) verwacht */
function buildOrderCommand(order) {
  const { type, symbol, volume, entryPrice, stopLoss, tp1, tp2, tp3 } = order
  const orderId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return {
    orderId,
    action: 'PLACE_ORDER',
    type: type || 'BUY',
    symbol: symbol || 'XAUUSD',
    volume: Number(volume),
    entryPrice: Number(entryPrice),
    stopLoss: Number(stopLoss),
    tp1: tp1 != null ? Number(tp1).toFixed(5) : undefined,
    tp2: tp2 != null ? Number(tp2).toFixed(5) : undefined,
    tp3: tp3 != null ? Number(tp3).toFixed(5) : undefined,
    timestamp: Date.now(),
  }
}

/**
 * Queue een order voor de agent (aan te roepen vanuit server.js wanneer user is ingelogd).
 * Retourneert { success, orderId } of { success: false, error }.
 */
function queueOrderForUser(userId, orderBody) {
  const command = buildOrderCommand(orderBody)
  addCommand(userId, command)
  return { success: true, orderId: command.orderId, command }
}

module.exports = {
  getStatusForUser,
  pushStatus,
  addCommand,
  getNextCommand,
  setResponse,
  getResponse,
  getUserIdFromReq,
  queueOrderForUser,
  buildOrderCommand,
  postAgentStatus,
  getAgentCommands,
  postAgentResponse,
  getAgentOrderStatus,
}
