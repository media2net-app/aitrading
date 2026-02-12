/**
 * Koppeling factuur-bestanden aan accounts (e-mail).
 * invoice-2026024.pdf → Globalservices (hortulanusglobalservices@gmail.com)
 * invoice-2026025.pdf → Weerbaarheid (info@responseweerbaarheid.nl)
 */
const path = require('path')
const fs = require('fs')

const INVOICES_DIR = path.join(__dirname, '..', 'invoices')

/** filename → user email (lowercase) */
const INVOICE_TO_EMAIL = {
  'invoice-2026024.pdf': 'hortulanusglobalservices@gmail.com',
  'invoice-2026025.pdf': 'info@responseweerbaarheid.nl',
}

/** Accounts met onbetaalde factuur: alleen Dashboard en Facturen klikbaar in sidebar */
const INVOICE_UNPAID_EMAILS = [
  'hortulanusglobalservices@gmail.com',  // globalservices
  'info@responseweerbaarheid.nl',         // weerbaarheid
]

function getInvoicesForEmail(userEmail) {
  const email = (userEmail || '').trim().toLowerCase()
  const list = []
  for (const [filename, assignedEmail] of Object.entries(INVOICE_TO_EMAIL)) {
    if (assignedEmail === email) {
      const filePath = path.join(INVOICES_DIR, filename)
      if (fs.existsSync(filePath)) {
        list.push({
          filename,
          label: filename.replace(/\.pdf$/i, '').replace(/-/g, ' '),
        })
      }
    }
  }
  return list.sort((a, b) => a.filename.localeCompare(b.filename))
}

function mayAccessInvoice(filename, userEmail) {
  const email = (userEmail || '').trim().toLowerCase()
  const assigned = INVOICE_TO_EMAIL[filename]
  return assigned === email
}

function getInvoicePath(filename) {
  if (!filename || !INVOICE_TO_EMAIL[filename]) return null
  const filePath = path.join(INVOICES_DIR, filename)
  if (!fs.existsSync(filePath)) return null
  return filePath
}

/** Of het account een betaalde factuur heeft (chiel, garage-eelman = betaald; global, weerbaarheid = onbetaald) */
function isInvoicePaid(userEmail) {
  const email = (userEmail || '').trim().toLowerCase()
  return !INVOICE_UNPAID_EMAILS.includes(email)
}

module.exports = {
  getInvoicesForEmail,
  mayAccessInvoice,
  getInvoicePath,
  isInvoicePaid,
}
