import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'

const questions = [
  {
    id: 'discipline',
    label: 'Heb je discipline en wil je een vaste strategie volgen?',
    name: 'discipline',
  },
  {
    id: 'calls',
    label: 'Ben je bereid wekelijks een 1-op-1 call te hebben om je voortgang te bespreken?',
    name: 'calls',
  },
  {
    id: 'forex',
    label: 'Ben je bekend met Forex / Daytraden?',
    name: 'forex',
  },
  {
    id: 'capital',
    label: 'Ben jij bereid om naast een minimaal startkapitaal van 500 euro om te traden, een eenmalige investering van 750 euro incl. BTW te doen voor het installeren en implementeren voor jou maatwerk AI Trading bot?',
    name: 'capital',
  },
] as const

type QuestionName = (typeof questions)[number]['name']

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [motivation, setMotivation] = useState('')
  const [answers, setAnswers] = useState<Record<QuestionName, 'ja' | 'nee' | ''>>({
    capital: '',
    discipline: '',
    calls: '',
    forex: '',
  })
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const setAnswer = (name: QuestionName, value: 'ja' | 'nee') => {
    setAnswers((prev) => ({ ...prev, [name]: value }))
  }

  const validate = (): boolean => {
    if (!name.trim()) {
      setError('Vul je naam in.')
      return false
    }
    if (!email.trim()) {
      setError('Vul je e-mailadres in.')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Vul een geldig e-mailadres in.')
      return false
    }
    if (!motivation.trim()) {
      setError('Vul je motivatie in.')
      return false
    }
    if (motivation.trim().length < 50) {
      setError('Je motivatie moet minimaal 50 tekens bevatten.')
      return false
    }
    if (answers.capital !== 'ja' || answers.discipline !== 'ja' || answers.calls !== 'ja' || answers.forex !== 'ja') {
      setError('Je moet op alle vier de vragen met "Ja" antwoorden om in aanmerking te komen voor toelating.')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const apiBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
    const signupUrl = `${apiBase}/api/signup`

    try {
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          motivation,
          answers
        })
      })

      let data: { success?: boolean; message?: string }
      try {
        data = await response.json()
      } catch {
        setError('De server reageert niet correct. Probeer het later opnieuw of neem contact met ons op.')
        return
      }

      if (data.success) {
        setSubmitted(true)
      } else {
        const message = data.message || (!response.ok
          ? 'De aanmeldservice is tijdelijk niet bereikbaar. Probeer het later opnieuw of stuur een e-mail naar aitrading@media2net.nl.'
          : 'Er is een fout opgetreden bij het verzenden van je aanmelding.')
        setError(message)
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('Er is een fout opgetreden bij het verzenden. Controleer je internetverbinding of probeer het later opnieuw.')
    }
  }

  if (submitted) {
    console.log('Rendering success page')
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dark-900 px-4">
        <div className="w-full max-w-md rounded-xl border border-dark-600 bg-dark-800 p-8 shadow-xl text-center">
          <div className="mb-6 text-4xl text-accent">✓</div>
          <h1 className="text-2xl font-bold text-white">Aanvraag ontvangen</h1>
          <p className="mt-4 text-gray-400">
            Bedankt voor je aanmelden en interesse in de AI Trading.software bot.
          </p>
          <p className="mt-3 text-gray-400">
            We nemen je aanmelding in behandeling, je ontvangt binnen 48 uur bericht terug of je geselecteerd bent of niet
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/" className="text-sm text-gray-400 hover:text-white">
              ← Terug naar home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark-900 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl border border-dark-600 bg-dark-800 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-semibold text-white">
            AI Trading.software
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white">Ja, ik wil mij aanmelden</h1>
        <p className="mt-2 text-gray-400">
          Vul onderstaande gegevens en motivatie in. Er is veel belangstelling getoond voor de AI Trading bot, en we hebben besloten selectief te zijn—om het succes van de bot te behouden en omdat je moet weten wat je doet en bereid moet zijn onze coaching te volgen.
        </p>
        <p className="mt-2 text-sm text-amber-400">
          Alle velden zijn verplicht
        </p>

        <div
          role="note"
          className="mt-6 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-gray-300"
        >
          <p className="font-medium text-accent">Let op</p>
          <p className="mt-1 leading-relaxed">
            We hebben plek voor maximaal 3 personen, dit doen we bewust om de kwaliteit van het coachen en de AI bot zo hoog mogelijk te houden. We willen enkel een community met serieuze leden die online geld willen verdienen met de AI trade bot.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Naam <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Je volledige naam"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              E-mailadres <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="naam@voorbeeld.nl"
            />
          </div>

          <div>
            <label htmlFor="motivation" className="block text-sm font-medium text-gray-300">
              Motivatie <span className="text-red-400">*</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Waarom moeten we jou kiezen? Schrijf kort waarom je gedisciplineerd bent, bereid bent onze coaching te volgen en wat je doel is. Minimaal 50 tekens.
            </p>
            <textarea
              id="motivation"
              required
              rows={5}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              className="mt-2 block w-full resize-y rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Vertel ons waarom je gekwalificeerd bent..."
            />
            {motivation.trim().length > 0 && motivation.trim().length < 50 && (
              <p className="mt-1 text-xs text-amber-400">
                Nog {50 - motivation.trim().length} tekens minimaal.
              </p>
            )}
          </div>

          <div className="border-t border-dark-600 pt-6">
            <ul className="space-y-5">
              {questions.map(({ id, label, name }) => (
                <li key={id}>
                  <p className="text-sm text-white">{label}</p>
                  <div className="mt-2 flex gap-6">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name={name}
                        checked={answers[name] === 'ja'}
                        onChange={() => setAnswer(name, 'ja')}
                        className="h-4 w-4 border-dark-500 bg-dark-700 text-accent focus:ring-accent"
                      />
                      <span className="text-gray-300">Ja</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name={name}
                        checked={answers[name] === 'nee'}
                        onChange={() => setAnswer(name, 'nee')}
                        className="h-4 w-4 border-dark-500 bg-dark-700 text-accent focus:ring-accent"
                      />
                      <span className="text-gray-300">Nee</span>
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-accent py-3.5 font-semibold text-dark-900 transition hover:bg-accent-hover"
          >
            Aanvraag indienen
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Heb je al een account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Mijn account
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-white">
            ← Terug naar home
          </Link>
        </p>
      </div>
    </div>
  )
}
