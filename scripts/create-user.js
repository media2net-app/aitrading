/**
 * Maak één of meer gebruikers aan. Zorg dat .env DATABASE_URL bevat.
 * Gebruik: node scripts/create-user.js
 *
 * Gebruikers:
 * - chiel@media2net.nl       admin, status admin (wachtwoord: W4t3rk0k3r^)
 * - info@garage-eelman.nl   lid, status onboarding (wachtwoord: G4r4g3-E3lm4n!Xk9#Qw2)
 */
const path = require('path')
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
} catch {
  // dotenv optioneel
}

const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const SALT_ROUNDS = 10

const USERS = [
  { email: 'chiel@media2net.nl', password: 'W4t3rk0k3r^', name: null, role: 'admin', status: 'admin' },
  { email: 'info@garage-eelman.nl', password: 'G4r4g3-E3lm4n!Xk9#Qw2', name: null, role: 'lid', status: 'onboarding' },
  { email: 'hortulanusglobalservices@gmail.com', password: 'H0rtuL4nUs!2026#', name: null, role: 'lid', status: 'onboarding' },
  { email: 'info@responseweerbaarheid.nl', password: 'R3sp0nse!Weer2026$', name: null, role: 'lid', status: 'onboarding' },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is niet gezet. Zet .env of export DATABASE_URL.')
    process.exit(1)
  }
  const prisma = new PrismaClient()
  try {
    for (const u of USERS) {
      const email = u.email.trim().toLowerCase()
      const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS)
      await prisma.user.upsert({
        where: { email },
        update: {
          passwordHash,
          name: u.name ?? undefined,
          role: u.role ?? 'lid',
          status: u.status ?? 'onboarding',
        },
        create: {
          email,
          passwordHash,
          name: u.name ?? null,
          role: u.role ?? 'lid',
          status: u.status ?? 'onboarding',
        },
      })
      console.log('Gebruiker aangemaakt/bijgewerkt:', email)
    }
    console.log('Klaar.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
