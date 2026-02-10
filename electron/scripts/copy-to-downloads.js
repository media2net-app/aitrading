const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '..', 'dist')
const outDir = path.join(__dirname, '..', '..', 'public', 'downloads')

if (!fs.existsSync(distDir)) {
  console.log('Geen dist/ map – skip copy.')
  process.exit(0)
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

function findFile(dir, predicate) {
  const names = fs.readdirSync(dir)
  for (const name of names) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isFile() && predicate(name)) return full
    if (fs.statSync(full).isDirectory()) {
      const found = findFile(full, predicate)
      if (found) return found
    }
  }
  return null
}

const dmg = findFile(distDir, (f) => f.endsWith('.dmg'))
const exe = findFile(distDir, (f) => f.endsWith('.exe'))

if (dmg) {
  const dest = path.join(outDir, 'AITradingAgent-Electron-Mac.dmg')
  fs.copyFileSync(dmg, dest)
  console.log('Gekopieerd:', dest)
}
if (exe) {
  const dest = path.join(outDir, 'AITradingAgent-Electron-Windows.exe')
  fs.copyFileSync(exe, dest)
  console.log('Gekopieerd:', dest)
}

if (!dmg && !exe) console.log('Geen .dmg of .exe gevonden in dist/')
