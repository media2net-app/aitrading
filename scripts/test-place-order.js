/**
 * Test: plaatst een testorder via de MT5-bridge.
 * Flow: Node schrijft commands.json → EA (AITradingBot.mq5) leest en plaatst order → schrijft responses.json → Node leest response.
 * Run: node scripts/test-place-order.js
 * Als de EA draait op de chart: je zou "Order geplaatst: <ticket>" moeten zien.
 * Zonder EA: na timeout "Geen response van EA".
 */
require('dotenv').config()
const path = require('path')
const fs = require('fs')

const mt5Path = process.env.MT5_BOT_PATH || path.join(
  require('os').homedir(),
  '.wine', 'drive_c', 'Users', 'Public', 'Documents', 'MT5_AI_Bot'
)
const commandFile = path.join(mt5Path, 'commands.json')

console.log('MT5 bridge map:', mt5Path)
console.log('')

const testOrder = {
  type: 'BUY',
  symbol: process.env.MT5_SYMBOL_GOLD || 'XAUUSD',
  volume: 0.01,
  entryPrice: 2650.50,
  stopLoss: 2635.50,
  tp1: 2660.50,
  tp2: 2670.50,
  tp3: 2680.50,
}

async function main() {
  const { bridge } = require('../api/mt5Bridge')

  console.log('1. Order schrijven en wachten op EA-response (max 15 s)...')
  const result = await bridge.placeOrderAndWait(testOrder, 15000)

  if (result.success) {
    console.log('OK: EA heeft order geplaatst.')
    console.log('OrderId:', result.orderId)
    console.log('Message:', result.message)
  } else {
    console.log('Resultaat:', result.message)
    if (result.orderId) {
      console.log('OrderId (commando was wel weggeschreven):', result.orderId)
      if (fs.existsSync(commandFile)) {
        console.log('commands.json bestaat nog (EA heeft het niet gelezen).')
        console.log('Checklist: 1) MetaEditor: AITradingBot.mq5 openen → F7 (Compileren)')
        console.log('           2) MT5: EA van chart halen en opnieuw aan chart koppelen')
        console.log('           3) MT5_BOT_PATH / BotFilePath =', mt5Path)
      }
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
