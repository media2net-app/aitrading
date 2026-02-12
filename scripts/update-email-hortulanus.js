const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const oldEmail = 'info@hortulanusglobalservices@gmail.com'
    const newEmail = 'hortulanusglobalservices@gmail.com'

    const existing = await prisma.user.findUnique({ where: { email: oldEmail } })
    if (!existing) {
      console.log('Geen gebruiker gevonden met', oldEmail)
      return
    }

    await prisma.user.update({
      where: { email: oldEmail },
      data: { email: newEmail },
    })
    console.log('E-mail gewijzigd van', oldEmail, 'naar', newEmail)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

