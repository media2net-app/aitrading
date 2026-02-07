# MT5-connectie en Analyse-pagina

## MT5-verbinding (file-based bridge)

De app praat met MetaTrader 5 via **bestanden** in een gedeelde map. De MQL5 Expert Advisor (EA) leest commando’s en schrijft status; de Express-server leest status en schrijft commando’s.

- **Standaardpad (Mac + Wine):** `~/.wine/drive_c/Users/Public/Documents/MT5_AI_Bot`
- **Configuratie:** Zet `MT5_BOT_PATH` in je environment als je een ander pad gebruikt (zie `.env.example`).

Bestanden in die map:

- `status.json` – door de EA geschreven: `connected`, `bid`, `ask`, `symbol`, `openPositions`, enz.
- `commands.json` – door de app geschreven; de EA leest en verwijdert het bestand na verwerking (bijv. `PLACE_ORDER`).
- `responses.json` – door de EA geschreven na het uitvoeren van een order.

**Voor een werkende MT5-koppeling:**

1. MT5 moet draaien met de EA op een chart (zelfde communicatiemap).
2. De EA moet hetzelfde pad gebruiken als de server (of je zet `MT5_BOT_PATH` gelijk aan het EA-pad).

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
