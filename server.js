require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const mt5 = require('./api/mt5Bridge')
const { getBarsInRange } = require('./api/marketData')
const { getDailyAnalysis, getDayDetail } = require('./api/analyseService')
const auth = require('./api/auth')
const agentHandlers = require('./api/agentHandlers')
const { getPrisma, hasDatabase } = require('./api/db')

let emailService = null
try {
  const { EmailService } = require('./src/services/emailService.cjs')
  emailService = new EmailService()
} catch (err) {
  console.warn('EmailService niet geladen:', err.message)
}

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

// MT5 API (file-based bridge; status kan van agent komen als user is ingelogd)
app.get('/api/mt5/status', (req, res) => {
  const userId = agentHandlers.getUserIdFromReq(req)
  if (userId) {
    const agentStatus = agentHandlers.getStatusForUser(userId)
    if (agentStatus) return res.json(agentStatus)
  }
  mt5.getStatus(req, res)
})
app.get('/api/mt5/path', mt5.getPath)
app.get('/api/mt5/log', mt5.getBridgeLog)
app.get('/api/mt5/equity-history', mt5.getEquityHistory)
app.get('/api/mt5/price', mt5.getPrice)
app.get('/api/mt5/positions', mt5.getPositions)
// Order: met auth → queue voor agent; zonder auth → file-based (lokaal)
app.post('/api/mt5/order', async (req, res) => {
  const userId = agentHandlers.getUserIdFromReq(req)
  if (userId) {
    try {
      const { type, volume, entryPrice, stopLoss, symbol, riskAmount, tp1, tp2, tp3 } = req.body || {}
      if (!type || volume == null || entryPrice == null || stopLoss == null) {
        return res.status(400).json({ success: false, error: 'Ontbrekende parameters (type, volume, entryPrice, stopLoss)' })
      }
      const result = agentHandlers.queueOrderForUser(userId, {
        type,
        symbol: symbol || 'XAUUSD',
        volume,
        entryPrice,
        stopLoss,
        riskAmount,
        tp1,
        tp2,
        tp3,
      })
      return res.json({
        success: true,
        data: { orderId: result.orderId, message: 'Order in wachtrij voor agent', queued: true },
      })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }
  mt5.postOrder(req, res)
})

// Agent API (local agent ↔ live API)
app.post('/api/mt5/agent/status', agentHandlers.postAgentStatus)
app.get('/api/mt5/agent/commands', agentHandlers.getAgentCommands)
app.post('/api/mt5/agent/response', agentHandlers.postAgentResponse)
app.get('/api/mt5/agent/order-status/:orderId', agentHandlers.getAgentOrderStatus)

// Auth API (DB + JWT)
app.post('/api/auth/register', auth.register)
app.post('/api/auth/login', auth.login)
app.get('/api/auth/me', auth.me)

// User MT5 settings (onboarding: bewaar per gebruiker)
app.get('/api/user/mt5-settings', auth.requireAuth, async (req, res) => {
  try {
    const prisma = getPrisma()
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { mt5Account: true, mt5Server: true, mt5Company: true, mt5Mode: true, mt5BotPath: true },
    })
    if (!user) return res.status(404).json({ success: false, error: 'Gebruiker niet gevonden' })
    res.json({
      success: true,
      data: {
        mt5Account: user.mt5Account ?? '',
        mt5Server: user.mt5Server ?? '',
        mt5Company: user.mt5Company ?? '',
        mt5Mode: user.mt5Mode ?? '',
        mt5BotPath: user.mt5BotPath ?? '',
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
app.put('/api/user/mt5-settings', auth.requireAuth, async (req, res) => {
  try {
    const { mt5Account, mt5Server, mt5Company, mt5Mode, mt5BotPath } = req.body || {}
    const prisma = getPrisma()
    const accountNum = mt5Account !== undefined && mt5Account !== '' && mt5Account !== null
      ? parseInt(String(mt5Account), 10)
      : null
    if (accountNum !== null && Number.isNaN(accountNum)) {
      return res.status(400).json({ success: false, error: 'Rekeningnummer moet een getal zijn' })
    }
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        mt5Account: accountNum,
        mt5Server: mt5Server != null ? String(mt5Server).trim() || null : undefined,
        mt5Company: mt5Company != null ? String(mt5Company).trim() || null : undefined,
        mt5Mode: mt5Mode != null ? String(mt5Mode).trim() || null : undefined,
        mt5BotPath: mt5BotPath != null ? String(mt5BotPath).trim() || null : undefined,
      },
    })
    res.json({ success: true, message: 'MT5-gegevens opgeslagen' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Agent-token: genereer langlevend token voor de local agent (eenmalig zichtbaar)
const crypto = require('crypto')
app.post('/api/user/agent-token', auth.requireAuth, async (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(token).digest('hex')
    const prisma = getPrisma()
    await prisma.user.update({
      where: { id: req.userId },
      data: { agentTokenHash: hash },
    })
    res.json({ success: true, data: { token } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Analyse API (live MT5 candles wanneer EA reageert, anders demo; vandaag nooit toekomstige uren)
app.get('/api/analyse/day-detail', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10)
    const symbol = req.query.symbol || 'XAUUSD'
    const mt5Symbol = symbol === 'XAUUSD' ? mt5.getGoldSymbol?.() || symbol : symbol
    let detail
    const candles = await mt5.bridge.getCandles(mt5Symbol, 'H1', 48)
    if (candles && candles.candles && candles.candles.length > 0) {
      detail = getDayDetail(symbol, date, { mt5Candles: candles.candles })
    } else {
      detail = getDayDetail(symbol, date)
    }
    res.json({ success: true, data: detail })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
app.get('/api/analyse/bars', (req, res) => {
  try {
    const symbol = req.query.symbol || 'XAUUSD'
    const from = req.query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const to = req.query.to || new Date().toISOString().slice(0, 10)
    const bars = getBarsInRange(symbol, from, to)
    res.json({ success: true, data: bars })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})
app.get('/api/analyse/daily', (req, res) => {
  (async () => {
    try {
      const date = req.query.date || new Date().toISOString().slice(0, 10)
      const symbol = req.query.symbol || 'XAUUSD'
      const userId = auth.getBearerToken(req) ? (auth.verifyToken(auth.getBearerToken(req))?.userId) : null

      if (hasDatabase() && userId) {
        const prisma = getPrisma()
        let analysis = await prisma.analysis.findUnique({
          where: { userId_date_symbol: { userId, date, symbol } },
        })
        if (analysis) {
          return res.json({
            success: true,
            data: {
              date: analysis.date,
              symbol: analysis.symbol,
              market: analysis.market,
              patterns: analysis.patterns,
              dataSource: analysis.dataSource,
            },
          })
        }
      }

      const result = getDailyAnalysis(symbol, date)
      if (hasDatabase() && userId && result.market) {
        const prisma = getPrisma()
        await prisma.analysis.upsert({
          where: { userId_date_symbol: { userId, date, symbol } },
          create: {
            userId,
            date,
            symbol,
            market: result.market,
            patterns: result.patterns || [],
            dataSource: result.dataSource || 'demo',
          },
          update: {
            market: result.market,
            patterns: result.patterns || [],
            dataSource: result.dataSource || 'demo',
          },
        })
      }
      res.json({ success: true, data: result })
    } catch (err) {
      res.status(500).json({ success: false, error: err.message })
    }
  })()
})
app.get('/api/analyses', auth.requireAuth, async (req, res) => {
  try {
    const prisma = getPrisma()
    const list = await prisma.analysis.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      take: 100,
      select: { id: true, date: true, symbol: true, dataSource: true, createdAt: true },
    })
    res.json({ success: true, data: list })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// API Routes
app.post('/api/signup', async (req, res) => {
  try {
    if (!emailService) {
      return res.status(503).json({ success: false, message: 'E-mailservice niet beschikbaar' })
    }
    const { name, email, motivation, answers } = req.body

    // Validate required fields
    if (!name || !email || !motivation || !answers) {
      return res.status(400).json({ 
        success: false, 
        message: 'Alle velden zijn verplicht' 
      })
    }

    // Send notification email to admin
    const notificationSent = await emailService.sendSignupNotification({
      name,
      email,
      motivation,
      answers
    })

    // Send confirmation email to user
    const confirmationSent = await emailService.sendConfirmationEmail(email, name)

    if (notificationSent && confirmationSent) {
      res.json({ 
        success: true, 
        message: 'Aanmelding succesvol ontvangen' 
      })
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Fout bij het verzenden van e-mails' 
      })
    }
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Serverfout bij verwerken aanmelding' 
    })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// App/server info voor dashboard-overzicht (welke server, poort)
app.get('/api/app-info', (req, res) => {
  const host = req.get('host') || `localhost:${PORT}`
  res.json({
    success: true,
    data: {
      apiServer: host,
      port: PORT,
    },
  })
})

// Serve React app for all other routes (Express 5: geen * meer, gebruik regex)
// Op Vercel serverless wordt alleen /api/* aangeroepen; deze route niet
app.get(/\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// Op Vercel: geen listen, app wordt geëxporteerd en aangeroepen via api/[[...path]].js
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = app
