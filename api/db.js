const { PrismaClient } = require('@prisma/client')

let prisma = null

function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

module.exports = { getPrisma, hasDatabase }
