import { useState, FormEvent } from 'react'

const AGREEMENT_TITLE = 'Samenwerkingsovereenkomst'

const AGREEMENT_BODY = `
Partijen:
1. Media2Net / AI Trading.software (hierna: "aanbieder")
2. De ondertekenaar (hierna: "deelnemer")

Overeenkomst:
De deelnemer neemt deel aan de dienst "AI Trading.software Bot voor XAU/USD" en stemt in met de volgende voorwaarden.

Artikel 1 – Dienst
De aanbieder levert toegang tot de AI Trading bot, ondersteuning bij het opzetten van een trading account, software-installatie en wekelijkse coaching. De exacte invulling wordt in onderling overleg vastgelegd.

Artikel 2 – Inzet en gedrag
De deelnemer volgt de afgesproken strategie, neemt deel aan de wekelijkse 1-op-1 gesprekken en handelt niet in strijd met de gegeven instructies. De deelnemer is zelf verantwoordelijk voor zijn of haar tradingbeslissingen en kapitaal.

Artikel 3 – Geen financieel advies
De aanbieder verleent geen financieel of beleggingsadvies. Handel in forex brengt risico’s met zich mee. De deelnemer handelt op eigen verantwoordelijkheid.

Artikel 4 – Vertrouwelijkheid
Afspraken, strategie en software zijn vertrouwelijk en mogen niet aan derden worden doorgegeven.

Artikel 5 – Looptijd en beëindiging
De samenwerking loopt tot wederzijds opzeggen. Bij opzegging door de deelnemer vervalt de toegang tot de bot en coaching volgens de dan geldende afspraken.

Artikel 6 – Toepasselijk recht
Op deze overeenkomst is Nederlands recht van toepassing.

Door ondertekening verklaart de deelnemer deze overeenkomst te hebben gelezen en te accepteren.
`.trim()

export default function AgreementPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Vul je volledige naam in.')
      return
    }
    if (!email.trim()) {
      setError('Vul je e-mailadres in.')
      return
    }
    if (!agreed) {
      setError('Je moet akkoord gaan met de overeenkomst om te ondertekenen.')
      return
    }

    setLoading(true)
    try {
      const apiBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
      const res = await fetch(`${apiBase}/api/agreement-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          agreed: true,
          signedAt: new Date().toISOString(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setSubmitted(true)
      } else {
        setError(data.message || 'Ondertekenen mislukt. Probeer het opnieuw.')
      }
    } catch {
      setError('Er is een fout opgetreden. Controleer je verbinding en probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dark-900 px-4">
        <div className="w-full max-w-md rounded-xl border border-dark-600 bg-dark-800 p-8 text-center shadow-xl">
          <div className="mb-6 text-4xl text-accent">✓</div>
          <h1 className="text-2xl font-bold text-white">Ondertekend</h1>
          <p className="mt-4 text-gray-400">
            Bedankt. De samenwerkingsovereenkomst is door ons ontvangen. We nemen zo nodig contact met je op.
          </p>
        </div>
      </div>
    )
  }

  const signedDate = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-white md:text-3xl">{AGREEMENT_TITLE}</h1>
        <p className="mt-1 text-sm text-gray-500">AI Trading.software – alleen voor toegelaten deelnemers</p>

        <div className="mt-8 rounded-xl border border-dark-600 bg-dark-800 p-6 md:p-8">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-300">
            {AGREEMENT_BODY}
          </pre>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-xl border border-dark-600 bg-dark-800 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-white">Digitaal ondertekenen</h2>
          <p className="text-sm text-gray-400">
            Vul onderstaande gegevens in en bevestig dat je de overeenkomst hebt gelezen en accepteert. Datum ondertekening: {signedDate}.
          </p>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="agreement-name" className="block text-sm font-medium text-gray-300">
              Volledige naam <span className="text-red-400">*</span>
            </label>
            <input
              id="agreement-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Zoals in je paspoort of ID"
            />
          </div>

          <div>
            <label htmlFor="agreement-email" className="block text-sm font-medium text-gray-300">
              E-mailadres <span className="text-red-400">*</span>
            </label>
            <input
              id="agreement-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="naam@voorbeeld.nl"
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              id="agreement-agreed"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-dark-500 bg-dark-700 text-accent focus:ring-accent"
            />
            <label htmlFor="agreement-agreed" className="text-sm text-gray-300">
              Ik heb de samenwerkingsovereenkomst gelezen en ga ermee akkoord. Ik onderteken deze digitaal op {signedDate}.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-3.5 font-semibold text-dark-900 transition hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Bezig met verzenden…' : 'Ondertekenen en versturen'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Alleen voor toegelaten deelnemers. Onderteken alleen als je hiervoor bent uitgenodigd.
        </p>
      </div>
    </div>
  )
}
