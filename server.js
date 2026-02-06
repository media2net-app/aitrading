const express = require('express')
const cors = require('cors')
const path = require('path')
const { EmailService } = require('./src/services/emailService.cjs')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

// Initialize email service
const emailService = new EmailService()

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

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
