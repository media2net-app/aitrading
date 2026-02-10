import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HeroSection } from '@/components/ui/hero-section-1'
import { CalculatorContent } from './CalculatorPage'

const features = [
  {
    title: 'Volledig automatische trading bot',
    description:
      'De AI bot analyseert goud (XAU/USD) 24/5 en plaatst trades automatisch volgens een vaste strategie. Geen emotie, geen handmatig klikken.',
    icon: '⚙︎',
  },
  {
    title: 'MetaTrader 5 + eigen broker',
    description:
      'De software draait op jouw eigen MT5-account bij een broker naar keuze. Je behoudt 100% controle over je rekening en kunt altijd ingrijpen.',
    icon: 'MT5',
  },
  {
    title: 'Lokale agent + webdashboard',
    description:
      'Een lokale agent koppelt MT5 op je pc aan ons webdashboard. Zo zie je overal je resultaten terug, en kun je vanaf de website trades starten.',
    icon: '☁︎',
  },
  {
    title: 'Wekelijkse 1-op-1 coaching',
    description:
      'Geen “zet aan en vergeet”-verhaal: we bouwen samen aan een plan. Wekelijks een 1-op-1 call om resultaten, risico en strategie te finetunen.',
    icon: '✦',
  },
]

const steps = [
  {
    step: 1,
    title: 'Trading account bij broker',
    text: 'We helpen je met het opzetten van je trading account bij onze (of jouw) broker—van registratie tot verificatie.',
  },
  {
    step: 2,
    title: 'Software & koppeling op je pc',
    text: 'We installeren MetaTrader 5, de EA (Expert Advisor) en de AI Trading bot op je pc en richten de MT5_AI_Bot‑bridge in.',
  },
  {
    step: 3,
    title: 'Dashboard & mobiele app',
    text: 'Je krijgt toegang tot het online dashboard en we helpen je MT5 op mobiel te configureren, zodat je altijd live mee kunt kijken.',
  },
  {
    step: 4,
    title: 'Demo‑week (7 dagen)',
    text: 'Elk nieuw account draait eerst 7 dagen demo. We stemmen de bot af op jouw account; pas als alles klopt ga je live.',
  },
  {
    step: 5,
    title: 'Strategie & risicoprofiel',
    text: 'We spreken samen een strategie af. Start je met €500? Dan adviseren we max. 2% risico per trade en realistische dagdoelen.',
  },
  {
    step: 6,
    title: 'Doorlopend traject + coaching',
    text: 'We volgen je resultaten wekelijks, sturen bij waar nodig en zorgen dat je gefocust blijft op je eigen groeiplan.',
  },
]

const stats = [
  { value: 'Feb 2026', label: 'Launch maand AI Trading.software' },
  { value: '€750', label: 'Eenmalige investering (incl. btw)' },
  { value: '€500', label: 'Min. startkapitaal op je eigen account' },
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
              De bot draait op korte timeframes van <strong className="text-gray-300">5 en 15 minuten</strong> en handelt volledig
              automatisch op jouw eigen MT5‑rekening. Jij kiest je broker, behoudt volledige controle en wij koppelen alles aan een
              online dashboard en wekelijkse coaching.
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

      {/* Track record */}
      <section id="resultaten" className="border-b border-dark-600 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Resultaten (track record)</h2>
            <p className="mt-4 text-gray-400">
              De AI Trading.software bot gaat live in <strong className="text-gray-300">februari 2026</strong>. Vanaf die maand
              bouwen we een transparant track record op. Elke maand werken we deze tabel bij met de daadwerkelijke resultaten
              van de live accounts die met de bot draaien.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-5xl overflow-x-auto rounded-xl border border-dark-600 bg-dark-800/60 p-4">
            <table className="min-w-full text-sm text-gray-300">
              <thead>
                <tr className="border-b border-dark-600 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 text-left">Jaar</th>
                  <th className="px-3 py-2">Feb</th>
                  <th className="px-3 py-2">Mrt</th>
                  <th className="px-3 py-2">Apr</th>
                  <th className="px-3 py-2">Mei</th>
                  <th className="px-3 py-2">Jun</th>
                  <th className="px-3 py-2">Jul</th>
                  <th className="px-3 py-2">Aug</th>
                  <th className="px-3 py-2">Sep</th>
                  <th className="px-3 py-2">Okt</th>
                  <th className="px-3 py-2">Nov</th>
                  <th className="px-3 py-2">Dec</th>
                  <th className="px-3 py-2">Jaar</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-dark-700/70">
                  <td className="px-3 py-2 text-left font-semibold text-white">2026</td>
                  <td className="px-3 py-2 text-amber-300">komt na 1e maand</td>
                  <td className="px-3 py-2 text-gray-500">—</td>
                  <td className="px-3 py-2 text-gray-500">—</td>
                  <td className="px-3 py-2 text-gray-500">—</td>
                  <td className="px-3 py-2 text-gray-500">—</td>
                  <td className="px-3 py-2 text-gray-500">—</td>
                  <td className="px-3 py-2 text-gray-500">—</td>
                  <td className="px-3 py-2 text-gray-500">—</td>
                  <td className="px-3 py-2 text-gray-500">—</td>
                  <td className="px-3 py-2 text-gray-500">—</td>
                  <td className="px-3 py-2 text-gray-500">—</td>
                  <td className="px-3 py-2 font-semibold text-gray-500">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-gray-500">
            <strong>Start track record:</strong> februari 2026 (launch van de software). Resultaten worden maandelijks bijgewerkt.
          </p>
          <p className="mx-auto mt-1 max-w-3xl text-center text-xs text-gray-500">
            Handelen in forex en CFD&apos;s brengt risico&apos;s met zich mee. In het verleden behaalde resultaten bieden geen garantie
            voor de toekomst. Investeer alleen geld dat je kunt missen.
          </p>
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

      {/* Pricing */}
      <section id="prijzen" className="border-b border-dark-600 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Prijzen & traject</h2>
            <p className="mt-4 text-gray-400">
              We hanteren een eenvoudig model: <strong className="text-gray-300">eenmalig</strong> betalen voor installatie,
              configuratie en coaching. De bot draait daarna op jouw eigen rekening—zonder abonnement.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <div className="rounded-2xl border border-accent/40 bg-accent/5 p-8 shadow-xl shadow-black/30">
              <p className="text-sm font-medium uppercase tracking-wide text-accent">AI Trading.software traject</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Maatwerk AI Trading bot + installatie</h3>

              <div className="mt-4 flex flex-wrap items-baseline gap-2">
                <span className="text-4xl font-bold text-white">€750</span>
                <span className="text-sm text-gray-400">eenmalig, incl. btw</span>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                + minimaal <strong className="text-gray-200">€500 startkapitaal</strong> op je eigen trading account bij een broker
                naar keuze.
              </p>

              <ul className="mt-6 space-y-2 text-sm text-gray-200">
                <li>• Installatie van MetaTrader 5, EA en AI Trading bot op jouw pc (remote onboarding).</li>
                <li>• Inrichting van de MT5_AI_Bot‑bridge en koppeling met het webdashboard.</li>
                <li>• 7‑daagse demo‑week om alles veilig te testen voordat je live gaat.</li>
                <li>• Wekelijkse 1‑op‑1 coaching (30 min) voor strategie, risico en mindset.</li>
                <li>• Toegang tot het online dashboard met live MT5‑status en orderkoppeling.</li>
              </ul>

              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/signup"
                  className="inline-flex rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-dark-900 shadow-lg transition hover:bg-accent-hover"
                >
                  <span className="font-bold">Ja</span>, ik wil mij aanmelden
                </Link>
                <p className="text-xs text-gray-400">
                  Je geld blijft altijd op je eigen brokerrekening. Wij hebben geen toegang tot je funds en geven geen financieel
                  advies.
                </p>
              </div>
            </div>
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
