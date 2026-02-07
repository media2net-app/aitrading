/**
 * MT5 file-based bridge: read status from EA, write commands for orders.
 * Same approach as aittrader; uses MT5_AI_Bot folder (Mac/Wine or MT5_BOT_PATH).
 */
const fs = require('fs')
const path = require('path')
const os = require('os')

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

class MT5Bridge {
  constructor() {
    this.mt5Path = getMT5Path()
    this.commandFile = path.join(this.mt5Path, 'commands.json')
    this.responseFile = path.join(this.mt5Path, 'responses.json')
    this.statusFile = path.join(this.mt5Path, 'status.json')
    this.ensureDirectory()
  }

  ensureDirectory() {
    if (!fs.existsSync(this.mt5Path)) {
      fs.mkdirSync(this.mt5Path, { recursive: true })
    }
  }

  readStatus() {
    try {
      if (!fs.existsSync(this.statusFile)) {
        return null
      }
      const content = fs.readFileSync(this.statusFile, 'utf8')
      return JSON.parse(content)
    } catch {
      return null
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

    const command = {
      action: 'PLACE_ORDER',
      orderId,
      type: order.type,
      symbol: order.symbol || 'XAUUSD',
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

function getStatus(req, res) {
  try {
    const status = bridge.readStatus()
    res.json({
      success: true,
      data: status,
      connected: status !== null && status.connected === true,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

function getPrice(req, res) {
  try {
    const status = bridge.readStatus()
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
    const status = bridge.readStatus()
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
  getPrice,
  getPositions,
  postOrder,
}
