require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const mt5 = require('./api/mt5Bridge')
const { getBarsInRange } = require('./api/marketData')
const { getDailyAnalysis, getDayDetail } = require('./api/analyseService')
const auth = require('./api/auth')
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

// MT5 API (file-based bridge)
app.get('/api/mt5/status', mt5.getStatus)
app.get('/api/mt5/path', mt5.getPath)
app.get('/api/mt5/equity-history', mt5.getEquityHistory)
app.get('/api/mt5/price', mt5.getPrice)
app.get('/api/mt5/positions', mt5.getPositions)
app.post('/api/mt5/order', mt5.postOrder)

// Auth API (DB + JWT)
app.post('/api/auth/register', auth.register)
app.post('/api/auth/login', auth.login)
app.get('/api/auth/me', auth.me)

// Analyse API (demo bars + daily analysis; when authenticated, save/load from DB)
app.get('/api/analyse/day-detail', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10)
    const symbol = req.query.symbol || 'XAUUSD'
    const detail = getDayDetail(symbol, date)
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
app.get(/\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
