/**
 * Vercel serverless catch-all: alle /api/*-requests (ook /api/auth/login etc.)
 * worden hier afgehandeld door de Express-app uit server.js.
 */
const app = require('../server.js')

module.exports = (req, res) => app(req, res)
