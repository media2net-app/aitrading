const express = require('express')
const cors = require('cors')
const path = require('path')
const nodemailer = require('nodemailer')

const app = express()
const PORT = process.env.PORT || 3001

// SMTP Configuration
const SMTP_CONFIG = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'aitrading@media2net.nl',
    pass: 'W4t3rk0k3r^'
  }
}

// Create transporter
const transporter = nodemailer.createTransport(SMTP_CONFIG)

// Middleware
app.use(cors())
app.use(express.json())

// Email sending function
async function sendSignupNotification(signupData) {
  try {
    const subject = `Nieuwe aanmelding: ${signupData.name}`
    
    const html = `
      <h2>Nieuwe aanmelding voor AI Trading</h2>
      <p><strong>Naam:</strong> ${signupData.name}</p>
      <p><strong>E-mail:</strong> ${signupData.email}</p>
      <p><strong>Motivatie:</strong></p>
      <p>${signupData.motivation}</p>
      
      <h3>Antwoorden op vragen:</h3>
      <ul>
        <li><strong>Startkapitaal €500+:</strong> ${signupData.answers.capital}</li>
        <li><strong>Discipline en strategie:</strong> ${signupData.answers.discipline}</li>
        <li><strong>Wekelijkse calls:</strong> ${signupData.answers.calls}</li>
      </ul>
      
      <p><strong>Aanvraagdatum:</strong> ${new Date().toLocaleString('nl-NL')}</p>
    `

    const mailOptions = {
      from: '"AI Trading" <aitrading@media2net.nl>',
      to: 'aitrading@media2net.nl',
      subject,
      html
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Admin notification sent:', result.messageId)
    return true
  } catch (error) {
    console.error('Error sending admin notification:', error)
    return false
  }
}

async function sendConfirmationEmail(userEmail, userName) {
  try {
    const subject = 'Je aanmelding voor AI Trading is ontvangen'
    
    const html = `
      <h2>Bedankt voor je aanmelding, ${userName}!</h2>
      <p>Je aanmelding voor de AI Trading bot is bij ons binnen.</p>
      <p>We beoordelen momenteel alle aanmeldingen en nemen binnenkort contact met je op.</p>
      <p>Let op: We werken alleen met een selectie van gedisciplineerde traders om het succes van de bot te garanderen.</p>
      
      <p>Met vriendelijke groet,<br>Team AI Trading</p>
    `

    const mailOptions = {
      from: '"AI Trading" <aitrading@media2net.nl>',
      to: userEmail,
      subject,
      html
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('User confirmation sent:', result.messageId)
    return true
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return false
  }
}

// API Routes
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, motivation, answers } = req.body

    // Validate required fields
    if (!name || !email || !motivation || !answers) {
      return res.status(400).json({ 
        success: false, 
        message: 'Alle velden zijn verplicht' 
      })
    }

    console.log('Processing signup:', { name, email })

    // Send notification email to admin
    const notificationSent = await sendSignupNotification({
      name,
      email,
      motivation,
      answers
    })

    // Send confirmation email to user
    const confirmationSent = await sendConfirmationEmail(email, name)

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
