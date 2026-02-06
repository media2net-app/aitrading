# Deploy – live signup

## Vercel (deploy via CLI)

Het project is gekoppeld aan Vercel: **media2net-apps-projects/aitrading**.

**Deployen:**
```bash
vercel          # preview
vercel --prod   # productie
```

**SPA + API:** In dit project staan al:
- `vercel.json` – build (Vite), output `dist`, en rewrites zodat `/signup` etc. naar `index.html` gaan; `/api/*` blijft naar de serverless functions.
- `api/signup.js` – serverless signup-endpoint (e-mail via nodemailer).

**Environment variables (Vercel dashboard → Project → Settings → Environment Variables):**

Zet voor het versturen van e-mails bij signup minimaal:
- `SMTP_PASS` – wachtwoord van het SMTP-account (verplicht op Vercel)

Optioneel (als je andere waarden wilt dan de huidige Hostinger SMTP):
- `SMTP_HOST` (default: smtp.hostinger.com)
- `SMTP_PORT` (default: 465)
- `SMTP_USER` (default: aitrading@media2net.nl)
- `SMTP_SECURE` (default: true)
- `ADMIN_EMAIL` – e-mailadres waar aanmeldingen naartoe gaan (default: aitrading@media2net.nl)
Na het zetten van de env vars opnieuw deployen zodat de API ze gebruikt.

**Overeenkomst:** De ondertekenpagina staat op `https://www.aitrading.software/agreement`. Geen token meer nodig.

---

## Waarom het signup-formulier op live faalt

Op **https://www.aitrading.software** staat alleen de **frontend** (statische build). Er draait **geen backend** op dat domein. Daardoor:

- `POST /api/signup` geeft 404
- Bezoekers zien: *"Er is een fout opgetreden bij het verzenden. Probeer het opnieuw."*

## Oplossing: API beschikbaar maken

Kies één van deze twee opties.

### Optie 1: Zelfde domein (aanbevolen)

Deploy de **volledige Node-app** (frontend + API op één server):

1. Build: `npm run build`
2. Start de server die zowel `dist` als de API serveert: `node server.js` (of `node server.cjs`)
3. Zorg dat **https://www.aitrading.software** naar deze Node-server wijst (niet naar alleen statische hosting).

Dan werkt `POST https://www.aitrading.software/api/signup` zonder extra configuratie.

### Optie 2: API op een ander domein

Als de API op een ander adres draait (bijv. `https://api.aitrading.software`):

1. Maak een bestand `.env` (niet in git) met:
   ```bash
   VITE_API_URL=https://api.aitrading.software
   ```
2. Build opnieuw: `npm run build`
3. Deploy de inhoud van `dist/` naar https://www.aitrading.software

De frontend roept dan `https://api.aitrading.software/api/signup` aan. Zorg dat op de API-server CORS is toegestaan voor `https://www.aitrading.software`.

## SPA-routing (404 bij directe link naar /signup)

Als je direct **https://www.aitrading.software/signup** opent en een 404 ziet, komt dat doordat de host alleen het bestand voor `/` levert. Voor een SPA moet **elke** pad (bijv. `/signup`) naar `index.html` leiden. Stel bij je hosting een “rewrite” of “fallback” in:

- **Firebase Hosting:** in `firebase.json`: `"rewrites": [{ "source": "**", "destination": "/index.html" }]`
- **Vercel:** `vercel.json` met `rewrites` naar `/index.html`
- **Netlify:** `_redirects` met `/* /index.html 200`

Dan werkt zowel de homepage als directe links naar `/signup`.
