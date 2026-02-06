const nodemailer = require('nodemailer')

const SMTP_CONFIG = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'aitrading@media2net.nl',
    pass: 'W4t3rk0k3r^'
  }
}

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter(SMTP_CONFIG)
  }

  async sendEmail(data) {
    try {
      const mailOptions = {
        from: '"AI Trading" <aitrading@media2net.nl>',
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', result.messageId)
      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  async sendSignupNotification(signupData) {
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

    const text = `
      Nieuwe aanmelding voor AI Trading
      
      Naam: ${signupData.name}
      E-mail: ${signupData.email}
      Motivatie: ${signupData.motivation}
      
      Antwoorden:
      - Discipline en strategie: ${signupData.answers.discipline}
      - Wekelijkse calls: ${signupData.answers.calls}
      - Bekend met Forex / Daytraden: ${signupData.answers.forex}
      - Min. startkapitaal €500 + eenmalig €750 incl. BTW (maatwerk bot): ${signupData.answers.capital}
      
      Aanvraagdatum: ${new Date().toLocaleString('nl-NL')}
    `

    return this.sendEmail({
      to: 'aitrading@media2net.nl',
      subject,
      html,
      text
    })
  }

  async sendConfirmationEmail(userEmail, userName) {
    const subject = 'Je aanmelding voor AI Trading is ontvangen'
    
    const html = `
      <h2>Bedankt voor je aanmelding, ${userName}!</h2>
      <p>Je aanmelding voor de AI Trading bot is bij ons binnen.</p>
      <p>We beoordelen momenteel alle aanmeldingen en nemen binnenkort contact met je op.</p>
      <p>Let op: We werken alleen met een selectie van gedisciplineerde traders om het succes van de bot te garanderen.</p>
      
      <p>Met vriendelijke groet,<br>Team AI Trading</p>
    `

    const text = `
      Bedankt voor je aanmelding, ${userName}!
      
      Je aanmelding voor de AI Trading bot is bij ons binnen.
      We beoordelen momenteel alle aanmeldingen en nemen binnenkort contact met je op.
      Let op: We werken alleen met een selectie van gedisciplineerde traders om het succes van de bot te garanderen.
      
      Met vriendelijke groet,
      Team AI Trading
    `

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
      text
    })
  }
}

module.exports = { EmailService }
