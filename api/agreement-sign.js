const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER || 'aitrading@media2net.nl',
    pass: process.env.SMTP_PASS || ''
  }
})

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'aitrading@media2net.nl'

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const { name, email, agreed, signedAt } = body

    if (!name || !email || agreed !== true) {
      return res.status(400).json({ success: false, message: 'Naam, e-mail en akkoord zijn verplicht.' })
    }

    const signedDate = signedAt
      ? new Date(signedAt).toLocaleString('nl-NL', { dateStyle: 'full', timeStyle: 'short' })
      : new Date().toLocaleString('nl-NL')

    const subject = `Samenwerkingsovereenkomst ondertekend: ${name}`
    const html = `
      <h2>Samenwerkingsovereenkomst digitaal ondertekend</h2>
      <p><strong>Naam:</strong> ${name}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Datum en tijd ondertekening:</strong> ${signedDate}</p>
      <p><strong>IP / context:</strong> aanvraag ontvangen via de ondertekenpagina.</p>
      <p>De ondertekenaar heeft de overeenkomst geaccepteerd via de digitale ondertekeningspagina.</p>
    `

    await transporter.sendMail({
      from: '"AI Trading" <aitrading@media2net.nl>',
      to: ADMIN_EMAIL,
      subject,
      html
    })

    res.status(200).json({ success: true, message: 'Ondertekening ontvangen.' })
  } catch (err) {
    console.error('Agreement sign error:', err)
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden. Probeer het later opnieuw.'
    })
  }
}
