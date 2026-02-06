import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'

const questions = [
  {
    id: 'capital',
    label: 'Ben je bereid te starten met minimaal €500 startkapitaal?',
    name: 'capital',
  },
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
    if (answers.capital !== 'ja' || answers.discipline !== 'ja' || answers.calls !== 'ja') {
      setError('Je moet op alle drie de vragen met "Ja" antwoorden om in aanmerking te komen voor toelating.')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const response = await fetch('http://localhost:3001/api/signup', {
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

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.message || 'Er is een fout opgetreden bij het verzenden van je aanmelding.')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setError('Er is een fout opgetreden bij het verzenden. Probeer het opnieuw.')
    }
  }

  if (submitted) {
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
          Vul onderstaande gegevens en motivatie in. We krijgen veel aanmeldingen en werken
          alleen met een selectie gedisciplineerde mensen—om het succes van de bot te behouden
          en omdat je moet weten wat je doet en bereid moet zijn onze coaching te volgen.
        </p>
        <p className="mt-2 text-sm text-amber-400">
          Alle velden zijn verplicht
        </p>

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
            <p className="text-sm font-medium text-gray-300">
              Beantwoord onderstaande vragen (alle drie met Ja vereist voor toelating):
            </p>
            <ul className="mt-4 space-y-5">
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
