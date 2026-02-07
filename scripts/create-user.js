/**
 * Maak één of meer gebruikers aan. Zorg dat .env DATABASE_URL bevat.
 * Gebruik: node -r dotenv/config scripts/create-user.js
 *
 * Maakt aan:
 * - info@garage-eelman.nl  (sterk wachtwoord: G4r4g3-E3lm4n!Xk9#Qw2)
 * - chiel@media2net.nl      (wachtwoord: W4t3rk0k3r^)
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
  { email: 'info@garage-eelman.nl', password: 'G4r4g3-E3lm4n!Xk9#Qw2', name: null },
  { email: 'chiel@media2net.nl', password: 'W4t3rk0k3r^', name: null },
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
        update: { passwordHash, name: u.name ?? undefined },
        create: {
          email,
          passwordHash,
          name: u.name ?? null,
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
