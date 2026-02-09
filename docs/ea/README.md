# AITradingBot.mq5

De enige EA in dit project. Leest **commands.json** (van de webapp), plaatst orders in MT5, en schrijft **status.json** en **responses.json**.

## Installatie

1. **Kopieer `docs/ea/AITradingBot.mq5`** naar je MT5 Experts-map (bijv. `MQL5/Experts/Advisors/`) en compileer in MetaEditor (F7).
2. Sleep **AITradingBot** op een XAUUSD- of GOLD-chart en zet **AutoTrading** aan.
3. **BotFilePath** (EA-input) en **MT5_BOT_PATH** (.env) moeten op de **zelfde fysieke map** wijzen.

## Pad (FILE_COMMON)

De EA gebruikt `FILE_COMMON`: het pad is relatief t.o.v. **Terminal Common\Files**.

- **Mac/Wine:** Vaak  
  `~/Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/users/user/AppData/Roaming/MetaQuotes/Terminal/Common/Files/MT5_AI_Bot`  
  In MT5: File → Open Data Folder → ga naar `Terminal/Common/Files`, maak map `MT5_AI_Bot`. EA **BotFilePath** = `MT5_AI_Bot/`.
- **.env:** `MT5_BOT_PATH=<volledig pad naar die map>` (zelfde als waar de EA schrijft).

## EA-inputs

| Input       | Beschrijving |
|-----------|--------------|
| BotFilePath | Map onder Common\Files, bijv. `MT5_AI_Bot/` |
| TradeSymbol | XAUUSD of GOLD (broker-afhankelijk) |
| MagicNumber | Magic number voor deze EA |

## Flow

- De app schrijft **commands.json** (action PLACE_ORDER of CLOSE_ORDER).
- De EA leest het bestand in OnTick, voert de order uit, schrijft **responses.json** en verwijdert **commands.json**.
- De EA schrijft elke seconde **status.json** (bid, ask, symbol, openPositions, timestamp).

## Bridge-log (connectie testen)

De bridge schrijft naar **bridge.log** (in dezelfde map als status.json, o.a. `MT5_AI_Bot/bridge.log`):

- **readStatus:** of status gelezen is, welk pad, aantal openPositions.
- **placeOrder:** order weggeschreven, orderId, type, symbol, volume.
- **waitForResponse:** response ontvangen of timeout.

Gebruik `tail -f <pad-naar-MT5_AI_Bot>/bridge.log` om live te zien of de connectie werkt. Het pad staat in de API-response onder `bridge.logFile`.

Zie **../EA_STATUS_SPEC.md** voor de velden in status.json.
