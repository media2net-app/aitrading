/**
 * Vercel serverless: alle /api/*-requests worden via rewrite hierheen gestuurd.
 * We herstellen het oorspronkelijke pad (+ query) zodat Express de juiste route matcht.
 */
module.exports = (req, res) => {
  try {
    const url = req.url || ''
    const q = url.indexOf('?')
    const params = q >= 0 ? new URLSearchParams(url.slice(q)) : new URLSearchParams()
    const path = params.get('path')
    if (path !== null && path !== '') {
      params.delete('path')
      const rest = params.toString()
      req.url = '/api/' + path + (rest ? '?' + rest : '')
    }
    const app = require('../server.js')
    return app(req, res)
  } catch (err) {
    console.error('API handler error:', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: err.message, stack: err.stack }))
  }
}
