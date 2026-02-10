# Local agent

Deze agent draait op je eigen PC en koppelt de MT5_AI_Bot-map (waar de EA in schrijft en leest) aan de live API van www.aitrading.software.

## Vereisten

- Node.js 18+
- De EA (AITradingBot.mq5) geïnstalleerd en actief op een chart; de map MT5_AI_Bot moet bestaan en door de EA gebruikt worden.

## Configuratie

Maak in de map `agent/` een bestand `.env` met:

```env
API_URL=https://www.aitrading.software
AGENT_TOKEN=<je agent-token van de Downloads-pagina>
MT5_BOT_PATH=/volledig/pad/naar/MT5_AI_Bot
```

Of zet deze als omgevingsvariabelen. Op Windows bijvoorbeeld:

```bat
set API_URL=https://www.aitrading.software
set AGENT_TOKEN=abc123...
set MT5_BOT_PATH=C:\Users\Jij\AppData\Roaming\MetaQuotes\Terminal\Common\Files\MT5_AI_Bot
node index.js
```

## Starten

Vanuit de projectroot:

```bash
cd agent
node index.js
```

Of met env vars in één regel:

```bash
API_URL=https://www.aitrading.software AGENT_TOKEN=<token> MT5_BOT_PATH=/pad/naar/MT5_AI_Bot node agent/index.js
```

## Wat doet de agent?

1. **Status:** Leest elke paar seconden `status.json` uit de MT5_AI_Bot-map en stuurt die naar de API. Het dashboard op de site toont dan je live MT5-status.
2. **Commands:** Vraagt periodiek bij de API of er een nieuwe order voor je klaarstaat. Zo ja, schrijft die als `commands.json` in de MT5_AI_Bot-map. De EA leest dat bestand, voert de order uit en schrijft `responses.json`.
3. **Response:** De agent ziet de response, stuurt die naar de API en de webapp kan het resultaat tonen.

Zodra de agent draait en de EA actief is op een chart, kun je vanaf www.aitrading.software orders plaatsen; ze worden via de agent naar jouw MT5 gestuurd.

## Standalone programma (geen Node nodig)

Gebruikers kunnen op de Downloads-pagina een kant-en-klaar programma downloaden voor Windows of Mac; dan hoeft Node.js niet geïnstalleerd te worden. Die bestanden worden gebouwd met:

```bash
# vanuit de projectroot
npm run build:agent
```

De eerste keer haalt `pkg` Node-binaries op (kan even duren). De uitvoer komt in `public/downloads/`:

- `AITradingAgent-win-x64.exe` (Windows)
- `AITradingAgent-macos-x64` (Mac Intel)
- `AITradingAgent-macos-arm64` (Mac Apple Silicon)

Plaats het bestand in een map en maak in de **zelfde map** een `.env` met `AGENT_TOKEN` en `MT5_BOT_PATH`; start daarna het programma.

## Electron-app (aanbevolen)

Een desktop-app met icoon in het systeemvak; werkt vaak waar de pkg-build op sommige Macs faalt. Bouwen:

```bash
# vanuit de projectroot
npm run build:agent-electron
```

Uitvoer in `electron/dist/` en gekopieerd naar `public/downloads/`:

- `AITradingAgent-Electron-Windows.exe` (Windows, portable)
- `AITradingAgent-Electron-Mac.dmg` (Mac)

De app leest `.env` naast de .exe (Windows) of uit `~/Library/Application Support/AITrading Agent/` (Mac).
