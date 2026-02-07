# MT5-connectie en Analyse-pagina

## MT5-verbinding (file-based bridge)

De app praat met MetaTrader 5 via **bestanden** in een gedeelde map. De MQL5 Expert Advisor (EA) leest commando’s en schrijft status; de Express-server leest status en schrijft commando’s.

**Meerdere gebruikers / meerdere PC’s:** Het systeem is bedoeld om door meerdere mensen op meerdere PC’s gedraaid te worden. Iedereen voert de **zelfde trades** uit (signaal centraal); alleen instellingen (lot size, risico) kunnen per persoon verschillen. De **accountgegevens** (rekeningnummer, server, broker) moeten per PC uit de **EA** komen: de EA schrijft ze in `status.json`, de app toont ze op het dashboard. Zo hoeft er geen .env per machine met accountgegevens. Zie **docs/EA_STATUS_SPEC.md** voor de exacte velden en MQL5-voorbeeldcode.

- **Standaardpad (Mac + Wine):** `~/.wine/drive_c/Users/Public/Documents/MT5_AI_Bot`
- **Configuratie:** Zet `MT5_BOT_PATH` in je environment als je een ander pad gebruikt (zie `.env.example`).

Bestanden in die map:

- **`status.json`** – door de EA geschreven. Verplicht: `connected`, `bid`, `ask`, `symbol`, `timestamp`. Voor dashboard Account & verbindingen: `login`, `server`, `company`, `mode` (zie docs/EA_STATUS_SPEC.md). De app toont wat de EA schrijft; alleen als de EA deze velden niet zet, gebruikt de app eventuele .env-fallback (`MT5_ACCOUNT`, `MT5_SERVER`, `MT5_COMPANY`, `MT5_MODE`).
- **`commands.json`** – door de app geschreven; de EA leest en verwijdert het bestand na verwerking (bijv. `PLACE_ORDER`).
- **`responses.json`** – door de EA geschreven na het uitvoeren van een order.

**Broker-symbool (GOLD vs XAUUSD):** Veel brokers tonen goud in MT5 als **GOLD** in plaats van XAUUSD. De app gebruikt intern XAUUSD; bij het plaatsen van orders wordt dat automatisch omgezet als je in `.env` zet: `MT5_SYMBOL_GOLD=GOLD`. De EA kan in `status.json` het symbool doorgeven (bijv. `"symbol": "GOLD"`); dat wordt in de app getoond.

**Voor een werkende MT5-koppeling:**

1. MT5 moet draaien met de EA op een chart (zelfde communicatiemap).
2. De EA moet hetzelfde pad gebruiken als de server (of je zet `MT5_BOT_PATH` gelijk aan het EA-pad).
3. Bij een live account met symbool **GOLD**: zet `MT5_SYMBOL_GOLD=GOLD` in `.env` en herstart de server.

**API-endpoints:**

- `GET /api/mt5/status` – of MT5 verbonden is en laatste status
- `GET /api/mt5/price` – bid/ask/mid
- `GET /api/mt5/positions` – open posities
- `POST /api/mt5/order` – order plaatsen (body: type, volume, entryPrice, stopLoss, symbol?, riskAmount?)

## Analyse-pagina

De **Analyse**-pagina (dashboard → Analyse) toont per gekozen dag:

- **Markt:** open, high, low, close en trend (stijgend/dalend/zijwaarts).
- **Patronen:** eenvoudige detectie (bijv. hogere bodems/toppen, dubbele top/bodem, doji-achtige kaars).

**Data (fase 1):** Er wordt **demo/synthetische** dagdata gebruikt (deterministic per datum), zodat de pagina direct bruikbaar is zonder MT5-history.

**Fase 2 (optioneel):** Echte bars kunnen later toegevoegd worden door de EA of een Python-script (MetaTrader5) dagbalken te laten schrijven naar bijv. `MT5_AI_Bot/daily_bars.json`; de backend kan dan overschakelen op die data als het bestand aanwezig is.

**API-endpoints voor analyse:**

- `GET /api/analyse/bars?symbol=XAUUSD&from=YYYY-MM-DD&to=YYYY-MM-DD` – dagbalken (nu demo).
- `GET /api/analyse/daily?date=YYYY-MM-DD&symbol=XAUUSD` – markt + patronen voor één dag.
