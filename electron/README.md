# AITrading Agent (Electron)

Desktop-app voor Windows en Mac. Na de build worden de bestanden gekopieerd naar `public/downloads/` zodat leden ze kunnen downloaden.

## Lokaal testen

```bash
npm install
cp .env.example .env   # vul AGENT_TOKEN en MT5_BOT_PATH in
npm start
```

Er verschijnt een icoon in het systeemvak; klik voor het venster, rechtermuisklik voor Afsluiten.

## Bouwen voor downloads

- **Alleen Mac:** `npm run build:mac` (gebruikt geen code signing)
- **Alleen Windows:** `npm run build:win`
- **Beide:** `npm run build:all`

Output komt in `dist/` en wordt gekopieerd naar `../public/downloads/`:

- `AITradingAgent-Electron-Mac.dmg`
- `AITradingAgent-Electron-Windows.exe`

Daarna opnieuw deployen zodat de site de nieuwe bestanden uitlevert.
