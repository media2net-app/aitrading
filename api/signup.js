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

async function sendSignupNotification(signupData) {
  const subject = `Nieuwe aanmelding: ${signupData.name}`
  const html = `
    <h2>Nieuwe aanmelding voor AI Trading</h2>
    <p><strong>Naam:</strong> ${signupData.name}</p>
    <p><strong>E-mail:</strong> ${signupData.email}</p>
    <p><strong>Motivatie:</strong></p>
    <p>${signupData.motivation}</p>
    <h3>Antwoorden op vragen:</h3>
    <ul>
      <li><strong>Discipline en strategie:</strong> ${signupData.answers.discipline}</li>
      <li><strong>Wekelijkse calls:</strong> ${signupData.answers.calls}</li>
      <li><strong>Bekend met Forex / Daytraden:</strong> ${signupData.answers.forex}</li>
      <li><strong>Min. startkapitaal €500 + eenmalig €750 incl. BTW (maatwerk bot):</strong> ${signupData.answers.capital}</li>
    </ul>
    <p><strong>Aanvraagdatum:</strong> ${new Date().toLocaleString('nl-NL')}</p>
  `
  await transporter.sendMail({
    from: '"AI Trading" <aitrading@media2net.nl>',
    to: process.env.ADMIN_EMAIL || 'aitrading@media2net.nl',
    subject,
    html
  })
}

async function sendConfirmationEmail(userEmail, userName) {
  const subject = 'Je aanmelding voor AI Trading is ontvangen'
  const html = `
    <h2>Bedankt voor je aanmelding, ${userName}!</h2>
    <p>Je aanmelding voor de AI Trading bot is bij ons binnen.</p>
    <p>We beoordelen momenteel alle aanmeldingen en nemen binnenkort contact met je op.</p>
    <p>Met vriendelijke groet,<br>Team AI Trading</p>
  `
  await transporter.sendMail({
    from: '"AI Trading" <aitrading@media2net.nl>',
    to: userEmail,
    subject,
    html
  })
}

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
    const { name, email, motivation, answers } = body

    if (!name || !email || !motivation || !answers) {
      return res.status(400).json({ success: false, message: 'Alle velden zijn verplicht' })
    }

    await sendSignupNotification({ name, email, motivation, answers })
    await sendConfirmationEmail(email, name)

    res.status(200).json({ success: true, message: 'Aanmelding succesvol ontvangen' })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({
      success: false,
      message: 'Serverfout bij verwerken aanmelding'
    })
  }
}
