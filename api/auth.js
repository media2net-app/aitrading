const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getPrisma, hasDatabase } = require('./db')

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const SALT_ROUNDS = 10

function createToken(userId, email) {
  return jwt.sign(
    { sub: userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return { userId: payload.sub, email: payload.email }
  } catch {
    return null
  }
}

function getBearerToken(req) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

async function register(req, res) {
  if (!hasDatabase()) {
    return res.status(503).json({ success: false, error: 'Database niet geconfigureerd' })
  }
  try {
    const { email, password, name } = req.body
    const trimmed = (email || '').trim().toLowerCase()
    if (!trimmed || !password) {
      return res.status(400).json({ success: false, error: 'E-mail en wachtwoord verplicht' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Wachtwoord minimaal 6 tekens' })
    }
    const prisma = getPrisma()
    const existing = await prisma.user.findUnique({ where: { email: trimmed } })
    if (existing) {
      return res.status(400).json({ success: false, error: 'Dit e-mailadres is al in gebruik' })
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await prisma.user.create({
      data: { email: trimmed, passwordHash, name: name || null },
      select: { id: true, email: true, name: true, role: true, status: true },
    })
    const token = createToken(user.id, user.email)
    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status } },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

async function login(req, res) {
  if (!hasDatabase()) {
    return res.status(503).json({ success: false, error: 'Database niet geconfigureerd' })
  }
  try {
    const { email, password } = req.body
    const trimmed = (email || '').trim().toLowerCase()
    if (!trimmed || !password) {
      return res.status(400).json({ success: false, error: 'E-mail en wachtwoord verplicht' })
    }
    const prisma = getPrisma()
    const user = await prisma.user.findUnique({ where: { email: trimmed } })
    if (!user) {
      return res.status(401).json({ success: false, error: 'Ongeldige inloggegevens' })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Ongeldige inloggegevens' })
    }
    const token = createToken(user.id, user.email)
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

async function me(req, res) {
  if (!hasDatabase()) {
    return res.status(503).json({ success: false, error: 'Database niet geconfigureerd' })
  }
  const token = getBearerToken(req)
  if (!token) {
    return res.status(401).json({ success: false, error: 'Geen token' })
  }
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Ongeldige of verlopen token' })
  }
  try {
    const prisma = getPrisma()
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    })
    if (!user) {
      return res.status(401).json({ success: false, error: 'Gebruiker niet gevonden' })
    }
    res.json({ success: true, data: { user } })
  } catch (err) {
    console.error('Me error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

function requireAuth(req, res, next) {
  if (!hasDatabase()) {
    return res.status(503).json({ success: false, error: 'Database niet geconfigureerd' })
  }
  const token = getBearerToken(req)
  if (!token) {
    return res.status(401).json({ success: false, error: 'Autorisatie vereist' })
  }
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Ongeldige of verlopen token' })
  }
  req.userId = payload.userId
  req.userEmail = payload.email
  next()
}

module.exports = {
  register,
  login,
  me,
  requireAuth,
  getBearerToken,
  verifyToken,
  hasDatabase,
}
