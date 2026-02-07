# Database (Prisma + Postgres)

Login en het opslaan van analyses lopen via **Prisma** en **PostgreSQL** (of Prisma Accelerate).

## Setup

1. **Environment**
   - Kopieer `.env.example` naar `.env`.
   - Zet in `.env`:
     - `DATABASE_URL` – Postgres- of Prisma Accelerate-connection string (nooit de echte key in git zetten).
     - `JWT_SECRET` – een sterk geheim voor JWT-sessies (verplicht in productie).

2. **Migrations**
   - Eerste keer: `npx prisma migrate deploy` (met `DATABASE_URL` gezet).
   - Bij Prisma Accelerate: voor migrations is soms een directe Postgres-URL nodig; zet die dan tijdelijk in `DATABASE_URL` voor `migrate deploy`, of gebruik de documentatie van Prisma Accelerate.

3. **Server**
   - Start de app met `node server.js` (of `npm run server:dev`). Zonder geldige `DATABASE_URL` geven login/register een 503 en worden analyses niet in de DB opgeslagen.

## Gedrag

- **Auth:** Registreren (`POST /api/auth/register`) en inloggen (`POST /api/auth/login`) gebruiken de `User`-tabel en JWT. `GET /api/auth/me` valideert de token.
- **Analyses:** Bij een ingelogde gebruiker worden daganalyses (Analyse-pagina) in de `analyses`-tabel opgeslagen en daarna uit de DB geladen. Zonder token wordt alleen de demo-analyse getoond (niet opgeslagen).

## Schema

- `User`: id, email (uniek), password_hash, name, created_at.
- `analyses`: id, user_id, date, symbol, market (JSON), patterns (JSON), data_source, created_at; uniek per (user_id, date, symbol).
