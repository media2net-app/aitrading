import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HeroSection } from '@/components/ui/hero-section-1'
import { CalculatorContent } from './CalculatorPage'

const features = [
  {
    title: 'XAU/USD (goud)',
    description: 'De bot is gebouwd voor goud: het paar dat nu volop beweegt. Geen keuzestress—één focus voor maximale resultaten.',
    icon: '▸',
  },
  {
    title: '5m & 15m timeframes',
    description: 'Handel op korte intervallen (5 en 15 minuten) voor snelle, hoge winsten met onze bewezen strategie.',
    icon: '◈',
  },
  {
    title: '94% gemiddelde winst',
    description: 'Onze AI volgt een vaste strategie en behaalt gemiddeld 94% winst. Geen gokwerk—gedisciplineerde uitvoering.',
    icon: '◉',
  },
  {
    title: 'Risicobeheer',
    description: 'Stop-loss, take-profit en positiegrootte zijn ingebouwd. De bot handelt 24/5 binnen duidelijke regels—de forex- en aandelenmarkten zijn in het weekend gesloten.',
    icon: '◇',
  },
]

const steps = [
  { step: 1, title: 'Trading account bij broker', text: 'We helpen je met het opzetten van je trading account bij onze aangesloten brokerpartner—van registratie tot verificatie.' },
  { step: 2, title: 'Software op je pc', text: 'We installeren op je pc: MetaTrader 5 voor het handelen, MQ5-implementatie, EA en onze zelf ontwikkelde AI Trade bot.' },
  { step: 3, title: 'MetaTrader 5 op mobiel', text: 'We helpen je MetaTrader 5 op je mobiel te configureren, zodat je altijd live mee kunt kijken hoe je ervoor staat.' },
  { step: 4, title: 'Demo-week (7 dagen)', text: 'Elk nieuw account draait 7 dagen test. We stemmen de bot af op jouw account; bij gemiddeld 90%+ winst over 7 dagen gaat je account live met de AI Bot.' },
  { step: 5, title: 'Strategie afspreken', text: 'We spreken een duidelijke strategie met je af zodat je stap voor stap groeit. Start je met €500? Dan adviseren we max. 2% verlies per trade en focus op €100 winst per dag om te beginnen.' },
  { step: 6, title: 'Wekelijkse 1-op-1 coaching', text: 'Elke week op een vast moment een videocall van 30 min om de voortgang en strategie te bespreken.' },
]

const stats = [
  { value: '94%', label: 'Gem. winst' },
  { value: 'XAU/USD', label: 'Goud (5m & 15m)' },
  { value: '99.9%', label: 'Uptime' },
]

export default function HomePage() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash === '#calculator') {
      const el = document.getElementById('calculator')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hash])

  return (
    <div className="min-h-screen bg-dark-900">
      <HeroSection />

      {/* KPI strip */}
      <section className="border-b border-dark-600 bg-dark-800/50 pb-12 pt-20">
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
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Wat is de AI Trading Bot?
            </h2>
            <p className="mt-4 text-gray-400">
              Een AI bot die specifiek is gebouwd voor <strong className="text-gray-300">goud (XAU/USD)</strong> in Forex.
              Goud beweegt momenteel sterk; door slim in te spelen op korte timeframes van <strong className="text-gray-300">5 en 15 minuten</strong> met onze vaste strategie pakt de bot hoge winsten. Gemiddeld behaalt de bot <strong className="text-accent">94% winst</strong>. Nieuw met Forex? De bot handelt voor je—je hoeft geen ervaring te hebben.
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

      {/* Calculator & Simulator – uitleg trading */}
      <section id="calculator" className="border-b border-dark-600 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Calculator &amp; Simulator
            </h2>
            <p className="mt-4 text-gray-400">
              Hieronder zie je een <strong className="text-gray-300">uitleg in de praktijk</strong>: wat doen bedragen als startkapitaal, risico% en lot size, en welke winsten en verliezen je kunt verwachten op basis van je instellingen en winstpercentage. Je hoeft dit niet te begrijpen om met ons te starten — de <strong className="text-accent">AI Bot</strong> doet het handelen automatisch voor je. Maar het is wel goed om te weten wat de getallen betekenen en wat er kan gebeuren bij winst of verlies.
            </p>
            <p className="mt-4 text-gray-400">
              Daarom is <strong className="text-gray-300">1-op-1 coaching voor strategie en begeleiding</strong> ook vereist. We adviseren ten alle tijden om rustig te beginnen en niet te veel risico te nemen: bij een winstpercentage van 90% heb je altijd met zo’n 10% verliestrades te maken. Als je te hoog inszet qua risico, kan één verliestrade je startkapitaal direct aantasten.
            </p>
          </div>
          <div className="mt-10">
            <CalculatorContent showTradingUitleg={false} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="hoe-werkt-het" className="border-b border-dark-600 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Hoe het werkt
            </h2>
            <p className="mt-4 text-gray-400">
              Nadat je je hebt aangemeld en uit de selectie bent toegelaten, gaan we als volgt te werk:
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ step, title, text }) => (
              <div key={step} className="relative text-center">
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
            Aanmelden voor toelating en starten met de AI bot voor XAU/USD—gemiddeld 94% winst op 5m en 15m.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-accent-hover"
            >
              <span className="font-bold">Ja</span>, ik wil mij aanmelden
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-600 bg-dark-800/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="text-sm text-gray-500">© AI Trading.software</span>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 sm:justify-end">
              <Link to="/" className="hover:text-white">Home</Link>
              <Link to="/#calculator" className="hover:text-white">Calculator &amp; simulator</Link>
              <Link to="/calculator" className="hover:text-white">Volledige calculator</Link>
              <Link to="/login" className="hover:text-white">Mijn account</Link>
              <Link to="/signup" className="hover:text-white">Ja, ik wil mij aanmelden</Link>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 max-w-4xl mx-auto">
              AI Trading.software is een tool ontwikkeld door Media2Net. Wij geven geen financieel advies, en zijn niet aansprakelijk voor verliezen.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
