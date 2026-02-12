/**
 * Koppeling factuur-bestanden aan accounts (e-mail).
 * invoice-2026024.pdf → Globalservices (hortulanusglobalservices@gmail.com)
 * invoice-2026025.pdf → Weerbaarheid (info@responseweerbaarheid.nl)
 *
 * Ondersteunt zowel lokale bestanden (map invoices/) als Vercel Blob-URLs.
 * - Voor productie vul je de env-vars INVOICE_2026024_URL en INVOICE_2026025_URL met de public Blob-URL.
 */
const path = require('path')
const fs = require('fs')

const INVOICES_DIR = path.join(__dirname, '..', 'invoices')

/** Meta per factuur: gekoppeld account + optionele Blob-URL */
const INVOICE_META = {
  'invoice-2026024.pdf': {
    email: 'hortulanusglobalservices@gmail.com',
    // Vercel Blob URL voor factuur 2026024 (Global Services)
    blobUrl: 'https://ljrg3dxfggxclbw2.public.blob.vercel-storage.com/invoices/invoice-2026024.pdf',
  },
  'invoice-2026025.pdf': {
    email: 'info@responseweerbaarheid.nl',
    // Vercel Blob URL voor factuur 2026025 (Response Weerbaarheid)
    blobUrl: 'https://ljrg3dxfggxclbw2.public.blob.vercel-storage.com/invoices/invoice-2026025.pdf',
  },
}

/** Accounts met onbetaalde factuur: alleen Dashboard en Facturen klikbaar in sidebar */
const INVOICE_UNPAID_EMAILS = [
  'hortulanusglobalservices@gmail.com', // globalservices
  'info@responseweerbaarheid.nl', // weerbaarheid
]

function normaliseEmail(email) {
  return (email || '').trim().toLowerCase()
}

function getInvoiceMeta(filename) {
  return INVOICE_META[filename] || null
}

function getInvoicesForEmail(userEmail) {
  const email = normaliseEmail(userEmail)
  const list = []
  for (const [filename, meta] of Object.entries(INVOICE_META)) {
    if (meta.email === email) {
      const label = filename.replace(/\.pdf$/i, '').replace(/-/g, ' ')
      // Als er een Blob-URL is, gebruiken we die.
      if (meta.blobUrl) {
        list.push({ filename, label, url: meta.blobUrl })
      } else {
        // Fallback: lokaal bestand uit invoices/
        const filePath = path.join(INVOICES_DIR, filename)
        if (fs.existsSync(filePath)) {
          list.push({ filename, label })
        }
      }
    }
  }
  return list.sort((a, b) => a.filename.localeCompare(b.filename))
}

function mayAccessInvoice(filename, userEmail) {
  const email = normaliseEmail(userEmail)
  const meta = getInvoiceMeta(filename)
  if (!meta) return false
  return normaliseEmail(meta.email) === email
}

function getInvoicePath(filename) {
  const meta = getInvoiceMeta(filename)
  if (!filename || !meta) return null
  const filePath = path.join(INVOICES_DIR, filename)
  if (!fs.existsSync(filePath)) return null
  return filePath
}

/** Of het account een betaalde factuur heeft (chiel, garage-eelman = betaald; global, weerbaarheid = onbetaald) */
function isInvoicePaid(userEmail) {
  const email = normaliseEmail(userEmail)
  return !INVOICE_UNPAID_EMAILS.includes(email)
}

module.exports = {
  getInvoicesForEmail,
  mayAccessInvoice,
  getInvoicePath,
  getInvoiceMeta,
  isInvoicePaid,
}
