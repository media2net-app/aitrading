# EA status.json – specificatie voor de bridge

De webapp leest **status.json** uit de MT5_AI_Bot-map. De EA moet dit bestand regelmatig (bijv. elke seconde) overschrijven met actuele gegevens. Zo kan het dashboard op elke PC automatisch de **eigen** accountgegevens tonen (rekeningnummer, server, broker, modus) zonder .env per machine.

## Doel: meerdere gebruikers, zelfde trades

- **Zelfde trades:** Het signaal (welke trade, wanneer) komt centraal; elke EA voert dezelfde trade uit op de eigen rekening (via `commands.json`).
- **Instellingen per persoon:** Lot size, risico e.d. kunnen per gebruiker verschillen (bijv. via de app of EA-inputs).
- **Accountgegevens per PC:** Elke EA schrijft zijn eigen `login`, `server`, `company`, `mode` in status.json → het dashboard toont automatisch de juiste rekening op die PC.

## Per app-gebruiker / per PC

- **App-inlog:** Iemand logt in met zijn eigen e-mail (bijv. chiel@media2net.nl of info@garage-eelman.nl). Dat bepaalt alleen wie er in de webapp is ingelogd.
- **MT5-rekening op het dashboard:** Die komt **niet** uit de app-account, maar uit de **EA op die PC**. De EA op de PC van chiel schrijft chiel’s MT5-rekening in status.json; de EA op de PC van info@garage-eelman schrijft hun MT5-rekening. Geen aparte configuratie per e-mail nodig.
- **Praktisch:** Als je morgen bij info@garage-eelman.nl op hun PC installeert: die persoon logt in met info@garage-eelman.nl, de EA op die PC vult status.json met **hun** MT5-account (rekeningnummer, server, broker). Het dashboard toont dan automatisch die rekening. Op jouw PC blijft chiel@media2net.nl met jouw MT5-rekening; op hun PC info@garage-eelman.nl met hun MT5-rekening.

## Verplichte velden in status.json

| Veld        | Type    | Beschrijving |
|------------|---------|--------------|
| `connected`| boolean | `true` als MT5 verbonden is en data geldig is |
| `bid`      | number  | Huidige bid |
| `ask`      | number  | Huidige ask |
| `symbol`   | string  | Symbool van de chart (bijv. `"GOLD"`, `"XAUUSD"`) |
| `timestamp`| number  | Unix-tijd (seconden) van de laatste update |

## Aanbevolen velden (voor dashboard Account & verbindingen)

Deze velden worden op het dashboard getoond. Zonder deze velden kan de beheerder ze tijdelijk in .env zetten (fallback).

| Veld      | Type   | Beschrijving | MQL5 |
|-----------|--------|--------------|------|
| `login`   | number | MT5-rekeningnummer | `AccountInfoInteger(ACCOUNT_LOGIN)` |
| `server`  | string | Servernaam (bijv. Ava-Real 1-MT5) | `AccountInfoString(ACCOUNT_SERVER)` |
| `company` | string | Brokernaam (bijv. Ava Trade Ltd.) | `AccountInfoString(ACCOUNT_COMPANY)` |
| `mode`    | string | Accountmodus (bijv. Hedge) | Zie onder |

Optioneel: `openPositions` (array van posities) voor de app.

## Voorbeeld status.json

```json
{
  "connected": true,
  "symbol": "GOLD",
  "bid": 4965.01,
  "ask": 4967.43,
  "spread": 2.42,
  "timestamp": 1739123456,
  "login": 89865117,
  "server": "Ava-Real 1-MT5",
  "company": "Ava Trade Ltd.",
  "mode": "Hedge",
  "openPositions": []
}
```

## EA: AITradingBot.mq5

In de map **ea/** staat **AITradingBot.mq5**. Die EA schrijft **status.json** (elke seconde) en leest **commands.json** om orders te plaatsen. Zie **ea/README.md** voor installatie en BotFilePath.

**Let op:** De EA schrijft naar **Terminal Common\\Files\\MT5_AI_Bot\\status.json** (`FILE_COMMON`). Zet `MT5_BOT_PATH` in de app op hetzelfde map op die PC.

## Prioriteit: EA overschrijft .env

De app leest eerst eventuele waarden uit .env (fallback) en overschrijft die met alles wat de EA in status.json zet. Dus zodra de EA `login`, `server`, `company`, `mode` schrijft, komen die op het dashboard – op elke PC met hun eigen rekening. .env is alleen bedoeld voor ontwikkeling of als de EA deze velden nog niet vult.
