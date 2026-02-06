import { Link } from 'react-router-dom'
import { HeroSection } from '@/components/ui/hero-section-1'

const features = [
  {
    title: 'Automatisch handelen',
    description: 'De AI bot voert trades uit op basis van strategieën en marktdata, 24/7.',
    icon: '▸',
  },
  {
    title: 'Signalen & analyses',
    description: 'Krijg real-time handelssignalen en marktanalyses gegenereerd door AI.',
    icon: '◈',
  },
  {
    title: 'Backtesting',
    description: 'Test strategieën op historische data voordat je live gaat.',
    icon: '◉',
  },
  {
    title: 'Risicobeheer',
    description: 'Ingebouwde stop-loss, take-profit en positiegrootte op basis van risico.',
    icon: '◇',
  },
]

const steps = [
  { step: 1, title: 'Account aanmaken', text: 'Registreer en koppel je broker of exchange.' },
  { step: 2, title: 'Strategie kiezen', text: 'Kies een AI-strategie of stel je eigen parameters in.' },
  { step: 3, title: 'Start handelen', text: 'Activeer de bot en volg je prestaties in het dashboard.' },
]

const stats = [
  { value: '10.000+', label: 'Actieve traders' },
  { value: '50M+', label: 'Trades uitgevoerd' },
  { value: '99.9%', label: 'Uptime' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-900">
      <HeroSection />

      {/* KPI strip */}
      <section className="border-b border-dark-600 bg-dark-800/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl font-bold text-accent sm:text-4xl">{value}</div>
                <div className="mt-1 text-sm text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-dark-600 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Wat is AI Trading Software?
            </h2>
            <p className="mt-4 text-gray-400">
              Een AI trading bot die voor jou analyseert, signaleert en automatisch kan handelen.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2">
            {features.map(({ title, description, icon }) => (
              <div
                key={title}
                className="rounded-xl border border-dark-600 bg-dark-800/50 p-6 transition hover:border-dark-500"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-xl text-accent">
                    {icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <p className="mt-3 text-gray-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="hoe-werkt-het" className="border-b border-dark-600 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Hoe het werkt
            </h2>
            <p className="mt-4 text-gray-400">
              In drie stappen begin je met automatisch handelen.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-10 md:grid-cols-3">
            {steps.map(({ step, title, text }) => (
              <div key={step} className="relative text-center">
                {/* Lijn loopt achter de cirkel door: lagere z-index */}
                {step < 3 && (
                  <div className="absolute left-1/2 top-7 z-0 hidden h-0.5 w-full bg-dark-500 md:block" aria-hidden />
                )}
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent bg-dark-800 text-lg font-bold text-accent">
                  {step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-gray-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Klaar om te starten?
          </h2>
          <p className="mt-4 text-gray-400">
            Maak een account aan en ontdek wat de AI trading bot voor jou kan doen.
          </p>
          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex rounded-lg bg-accent px-8 py-4 text-base font-semibold text-dark-900 shadow-lg transition hover:bg-accent-hover"
            >
              Login / Registreren
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600 bg-dark-800/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="text-sm text-gray-500">© AI Trading Software</span>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link to="/" className="hover:text-white">Home</Link>
              <Link to="/login" className="hover:text-white">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
