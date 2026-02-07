# EA: MT5-gegevens naar status.json

De webapp leest **status.json** uit de MT5_AI_Bot-map. De EA moet dit bestand regelmatig overschrijven met actuele MT5-gegevens (rekening, server, broker, bid/ask, balance, equity, profit, openPositions).

**Versie:** Gebruik **v5.0** (bestand **`MT5_REST_API_EA.mq5`**). Dit is de volledige originele EA (request/response, place-order, candles, enz.) met status.json voor het dashboard. Geen aparte .mqh nodig: alles staat in één bestand.

Vervang in MetaEditor je oude v4.1 door de inhoud van **`docs/ea/MT5_REST_API_EA.mq5`** uit dit project.

## Gebruik in je EA

1. **Kopieer `MT5_REST_API_EA.mq5`** naar je Experts-map (bijv. `MQL5/Experts/`) en compileer. De status.json-logica (balance, equity, profit, openPositions) zit erin; er is **geen** `MT5_StatusWriter.mqh` meer nodig.

2. **Optioneel:** Voor een andere EA kun je **`MT5_StatusWriter.mqh`** includen en `WriteMT5Status()` aanroepen in OnTick/OnTimer. Voor de standaard REST API EA is dat niet nodig; die gebruikt de ingebouwde status-logica.

## Pad naar status.json

De .mqh schrijft naar **Terminal Common\Files\MT5_AI_Bot\status.json** (`FILE_COMMON`).

- **Windows:** Vaak `C:\Users\Public\Documents\MetaQuotes\Terminal\Common\Files\MT5_AI_Bot\` of onder AppData. Zoek op die PC naar de map waar `status.json` verschijnt nadat de EA eenmaal heeft gedraaid.
- **App (MT5_BOT_PATH):** Zet in de webapp op die PC in `.env` het **zelfde** pad, bijv.  
  `MT5_BOT_PATH=C:\Users\Public\Documents\MetaQuotes\Terminal\Common\Files\MT5_AI_Bot`  
  (of het pad dat op jouw installatie geldt).

Dan toont het dashboard automatisch rekeningnummer, server, broker en modus uit de EA.

## Velden in status.json

| Veld        | Bron in MQL5 |
|------------|----------------|
| connected  | true |
| symbol     | Symbol() |
| bid, ask   | SymbolInfoDouble(SYMBOL_BID/ASK) |
| balance    | AccountInfoDouble(ACCOUNT_BALANCE) |
| equity     | AccountInfoDouble(ACCOUNT_EQUITY) |
| profit     | AccountInfoDouble(ACCOUNT_PROFIT) |
| openPositions | Loop PositionsTotal() → ticket, symbol, type, volume, profit, sl, tp |
| login      | AccountInfoInteger(ACCOUNT_LOGIN) |
| server     | AccountInfoString(ACCOUNT_SERVER) |
| company    | AccountInfoString(ACCOUNT_COMPANY) |
| mode       | AccountInfoInteger(ACCOUNT_TRADE_MODE) → Hedge/Full/… |

De EA **MT5_StatusWriter.mqh** schrijft al balance, equity, profit en openPositions. Daarmee toont het dashboard echte Balance, P&L en Open trades; de equity-curve wordt opgebouwd uit de equity-history (per status-request een punt).

Zie ook **../EA_STATUS_SPEC.md**.
