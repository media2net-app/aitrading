import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, TrendingUp, TrendingDown } from 'lucide-react'

const infoBoxClass = 'mt-2 rounded-lg border border-dark-500 bg-dark-700/50 px-3 py-2 text-xs text-gray-400 leading-relaxed'

const fieldInfos: Record<string, { title: string; text: string }> = {
  capital: {
    title: 'Startkapitaal',
    text: 'Het bedrag waarmee je gaat handelen. Bij een hoger kapitaal kun je per trade meer risico nemen (in euro’s), maar het percentage risico blijft hetzelfde als je je stop-loss % gelijk houdt.',
  },
  sl: {
    title: 'Stop-loss %',
    text: 'Het maximale verlies per trade als percentage van je kapitaal. Bij 2% en €500 kapitaal riskeer je €10 per trade. Een stop-loss sluit de trade automatisch als de koers tegen je in beweegt, zodat verliezen beperkt blijven.',
  },
  winRate: {
    title: 'Winstratio / win rate',
    text: 'Het percentage trades dat winst oplevert. 90% betekent dat 9 van de 10 trades winstgevend zijn. Hoe hoger dit percentage, hoe meer winst je gemiddeld per trade maakt (bij gelijke risk:reward).',
  },
  riskReward: {
    title: 'Risk:Reward',
    text: 'De verhouding tussen wat je riskeert en wat je kunt winnen per trade. 1:1 betekent: bij winst verdien je evenveel als je bij verlies zou verliezen. 1:1,5 betekent: bij winst verdien je 1,5× je risico. Hoe hoger het reward-deel, hoe gunstiger voor je verwachte winst.',
  },
  target: {
    title: 'Doel winst per dag',
    text: 'Het bedrag aan winst dat je per dag wilt halen. De calculator berekent hoeveel trades je daarvoor (gemiddeld) nodig hebt op basis van je overige instellingen.',
  },
  lotSize: {
    title: 'Lot size',
    text: 'De grootte van je positie in lots. Bij goud (XAU/USD) is 1 lot = 100 troy ounce. 0,1 lot = 10 oz. Hoe groter de lot size, hoe meer winst of verlies per punt beweging. De voorbeeldtrade-simulator gebruikt dit voor de bedragen. Bij de meeste brokers is de minimale lot size 0,01 lot — kleinere posities zijn vaak niet mogelijk.',
  },
}

type SimPhase = 'idle' | 'win' | 'loss'
const SIM_STEP_MS = 700

export function CalculatorContent({ showTradingUitleg = true }: { showTradingUitleg?: boolean }) {
  const [capital, setCapital] = useState(500)
  const [slPercent, setSlPercent] = useState(2)
  const [winRatePercent, setWinRatePercent] = useState(90)
  const [rewardRatio, setRewardRatio] = useState(1)
  const [targetDaily, setTargetDaily] = useState(100)
  const [lotSize, setLotSize] = useState(0.1)

  const [simPhase, setSimPhase] = useState<SimPhase>('idle')
  const [simStep, setSimStep] = useState(0)
  const [simRunning, setSimRunning] = useState(false)

  const result = useMemo(() => {
    const riskPerTrade = capital * (slPercent / 100)
    const rewardPerTrade = riskPerTrade * rewardRatio
    const winRate = winRatePercent / 100
    const lossRate = 1 - winRate
    const expectedValuePerTrade = winRate * rewardPerTrade - lossRate * riskPerTrade
    const tradesNeededForTarget =
      expectedValuePerTrade > 0 ? Math.ceil(targetDaily / expectedValuePerTrade) : null
    const expectedDailyIf10Trades = 10 * expectedValuePerTrade
    const expectedDailyIf15Trades = 15 * expectedValuePerTrade

    return {
      riskPerTrade,
      rewardPerTrade,
      expectedValuePerTrade,
      tradesNeededForTarget,
      expectedDailyIf10Trades,
      expectedDailyIf15Trades,
    }
  }, [capital, slPercent, winRatePercent, rewardRatio, targetDaily])

  // Voorbeeld trade goud (visueel + simulatie) – winst/verlies uit lot size + calculator
  const XAU_CONTRACT_SIZE = 100 // 1 lot = 100 oz
  const USD_TO_EUR = 1.05
  const exampleEntry = 2650
  const exampleSl = 2640
  const exampleTp1 = 2655
  const exampleTp2 = 2662
  const exampleTp3 = 2670

  // In de praktijk: risico in € bepaalt je lot size. Lot size = riskEur / (verlies per lot in EUR).
  const verliesPerLotEur = (exampleEntry - exampleSl) * XAU_CONTRACT_SIZE / USD_TO_EUR
  const recommendedLotSize = useMemo(() => {
    const riskEur = result.riskPerTrade
    if (verliesPerLotEur <= 0) return 0.01
    return Math.round((riskEur / verliesPerLotEur) * 1000) / 1000
  }, [result.riskPerTrade, verliesPerLotEur])

  // Maximale lot size zodat verlies bij SL niet groter is dan je kapitaal
  const maxLotSizeVoorKapitaal = useMemo(() => {
    if (verliesPerLotEur <= 0) return 10
    const maxLot = (capital * USD_TO_EUR) / ((exampleEntry - exampleSl) * XAU_CONTRACT_SIZE)
    return Math.round((maxLot * 1000)) / 1000
  }, [capital, verliesPerLotEur])

  const exampleTrade = useMemo(() => {
    const verliesUsd = (exampleEntry - exampleSl) * XAU_CONTRACT_SIZE * lotSize
    const winstUsd =
      ((exampleTp1 - exampleEntry) + (exampleTp2 - exampleEntry) + (exampleTp3 - exampleEntry)) *
      XAU_CONTRACT_SIZE *
      (lotSize / 3)
    return {
      asset: 'Goud (XAU/USD)',
      type: 'BUY' as const,
      entry: exampleEntry,
      sl: exampleSl,
      tp1: exampleTp1,
      tp2: exampleTp2,
      tp3: exampleTp3,
      exampleWinstEur: Math.round((winstUsd / USD_TO_EUR) * 100) / 100,
      exampleVerliesEur: Math.round((verliesUsd / USD_TO_EUR) * 100) / 100,
    }
  }, [lotSize])

  const verliesOverschrijdtKapitaal = exampleTrade.exampleVerliesEur > capital
  const priceMin = exampleTrade.sl - 5
  const priceMax = exampleTrade.tp3 + 5
  const priceRange = priceMax - priceMin
  const toPercent = (p: number) => ((p - priceMin) / priceRange) * 100

  const currentSimPrice =
    simPhase === 'idle'
      ? exampleTrade.entry
      : simPhase === 'win'
        ? (simStep === 0 ? exampleTrade.entry : simStep === 1 ? exampleTrade.tp1 : simStep === 2 ? exampleTrade.tp2 : exampleTrade.tp3)
        : simStep === 0
          ? exampleTrade.entry
          : exampleTrade.sl

  const tp1Hit = simPhase === 'win' && simStep >= 1
  const tp2Hit = simPhase === 'win' && simStep >= 2
  const tp3Hit = simPhase === 'win' && simStep >= 3
  const slHit = simPhase === 'loss' && simStep >= 1
  const simDone = (simPhase === 'win' && simStep >= 4) || (simPhase === 'loss' && simStep >= 1)

  const startSimWinst = () => {
    setSimPhase('win')
    setSimStep(0)
    setSimRunning(true)
  }
  const startSimVerlies = () => {
    setSimPhase('loss')
    setSimStep(0)
    setSimRunning(true)
  }
  const resetSim = () => {
    setSimPhase('idle')
    setSimStep(0)
    setSimRunning(false)
  }

  useEffect(() => {
    if (!simRunning) return
    if (simPhase === 'win') {
      if (simStep < 4) {
        const t = setTimeout(() => setSimStep((s) => s + 1), SIM_STEP_MS)
        return () => clearTimeout(t)
      }
      setSimRunning(false)
    } else if (simPhase === 'loss') {
      if (simStep < 1) {
        const t = setTimeout(() => setSimStep(1), SIM_STEP_MS)
        return () => clearTimeout(t)
      }
      setSimRunning(false)
    }
  }, [simPhase, simStep, simRunning])

  return (
    <>
        {showTradingUitleg && (
          <div className="mt-4 rounded-xl border border-dark-600 bg-dark-800/80 p-4 text-sm text-gray-400">
            <p className="font-medium text-gray-300">Hoe werkt trading in de praktijk?</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              <li>Je kiest hoeveel je <strong className="text-gray-300">per trade wilt risicoën</strong> (bijv. 2% van je kapitaal).</li>
              <li>Die risico‑€ bepaalt je <strong className="text-gray-300">lot size</strong>: hoe kleiner de afstand tot je stop-loss, hoe groter de positie (in lots) die je mag nemen om precies dat bedrag te verliezen bij SL.</li>
              <li>Formule: verlies bij SL = (entry − SL in $) × 100 × lot size (goud), omgerekend naar €. Om je risico te halen: lot size = risico‑€ ÷ (verlies per lot in €).</li>
              <li>De calculator koppelt risico%, kapitaal en de voorbeeldtrade: gebruik de knop &quot;Gebruik lot size voor X% risico&quot; zodat de voorbeeldtrade overeenkomt met je ingestelde risico.</li>
            </ul>
          </div>
        )}

        <div className={`grid gap-8 lg:grid-cols-[1fr,340px] ${showTradingUitleg ? 'mt-8' : 'mt-6'}`}>
          <div className="space-y-6 rounded-xl border border-dark-600 bg-dark-800 p-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              Startkapitaal (€)
              <span className="text-gray-500" title={fieldInfos.capital.text}>
                <HelpCircle className="size-4" />
              </span>
            </label>
            <div className={infoBoxClass}>{fieldInfos.capital.text}</div>
            <input
              type="number"
              min={100}
              step={50}
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value) || 500)}
              className="mt-2 block w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              Stop-loss per trade (%)
              <span className="text-gray-500" title={fieldInfos.sl.text}>
                <HelpCircle className="size-4" />
              </span>
            </label>
            <div className={infoBoxClass}>{fieldInfos.sl.text}</div>
            <input
              type="number"
              min={0.5}
              max={10}
              step={0.5}
              value={slPercent}
              onChange={(e) => setSlPercent(Number(e.target.value) || 2)}
              className="mt-2 block w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              Winstratio / win rate (%)
              <span className="text-gray-500" title={fieldInfos.winRate.text}>
                <HelpCircle className="size-4" />
              </span>
            </label>
            <div className={infoBoxClass}>{fieldInfos.winRate.text}</div>
            <input
              type="number"
              min={50}
              max={100}
              step={5}
              value={winRatePercent}
              onChange={(e) => setWinRatePercent(Number(e.target.value) || 90)}
              className="mt-2 block w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              Risk:Reward (1 : …)
              <span className="text-gray-500" title={fieldInfos.riskReward.text}>
                <HelpCircle className="size-4" />
              </span>
            </label>
            <div className={infoBoxClass}>{fieldInfos.riskReward.text}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500">1 :</span>
              <input
                type="number"
                min={0.5}
                max={3}
                step={0.1}
                value={rewardRatio}
                onChange={(e) => setRewardRatio(Number(e.target.value) || 1)}
                className="block w-24 rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <span className="text-sm text-gray-500">
                (bijv. 1 = 1:1, 1,5 = 1:1,5)
              </span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              Doel winst per dag (€)
              <span className="text-gray-500" title={fieldInfos.target.text}>
                <HelpCircle className="size-4" />
              </span>
            </label>
            <div className={infoBoxClass}>{fieldInfos.target.text}</div>
            <input
              type="number"
              min={10}
              step={10}
              value={targetDaily}
              onChange={(e) => setTargetDaily(Number(e.target.value) || 100)}
              className="mt-2 block w-full rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              Lot size (voorbeeldtrade)
              <span className="text-gray-500" title={fieldInfos.lotSize.text}>
                <HelpCircle className="size-4" />
              </span>
            </label>
            <div className={infoBoxClass}>{fieldInfos.lotSize.text}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0.01}
                max={10}
                step={0.01}
                value={lotSize}
                onChange={(e) => setLotSize(Number(e.target.value) || 0.1)}
                className="block w-24 rounded-lg border border-dark-500 bg-dark-700 px-4 py-3 text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <span className="text-sm text-gray-500">lot (1 lot = 100 oz goud)</span>
              <button
                type="button"
                onClick={() => setLotSize(Math.max(0.01, Math.min(10, recommendedLotSize)))}
                className="rounded-lg border border-accent/50 bg-accent/10 px-2 py-1.5 text-xs font-medium text-accent hover:bg-accent/20"
              >
                Gebruik lot size voor {slPercent}% risico ({result.riskPerTrade.toFixed(0)} €)
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Bij deze voorbeeld-SL past voor jouw risico: <strong className="text-gray-400">{recommendedLotSize} lot</strong> → verlies bij SL = €{result.riskPerTrade.toFixed(2)}. Minimale lot size bij veel brokers: <strong className="text-gray-400">0,01 lot</strong>.
            </p>
            {recommendedLotSize > 0 && recommendedLotSize < 0.01 && (
              <p className="mt-1 text-xs text-amber-400">
                Je aanbevolen lot size ({recommendedLotSize} lot) ligt onder het minimum van veel brokers. Je moet dan min. 0,01 lot handelen — je werkelijk risico per trade wordt daarmee hoger dan {slPercent}%.
              </p>
            )}
            {verliesOverschrijdtKapitaal && (
              <div className="mt-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                <strong>Niet doen met dit kapitaal.</strong> Bij stop-loss verlies je €{exampleTrade.exampleVerliesEur.toFixed(0)} — dat is <strong>meer dan je hele startkapitaal</strong> van €{capital}. Met €{capital} past bij deze SL maximaal <strong>{maxLotSizeVoorKapitaal} lot</strong> (verlies bij SL = €{capital}). Kies een kleinere lot size of gebruik de knop voor {slPercent}% risico.
              </div>
            )}
          </div>
          </div>

          {/* Voorbeeld trade – simulatie */}
          <div className="rounded-xl border border-dark-600 bg-dark-800 p-5 lg:sticky lg:top-8">
            <h2 className="text-base font-semibold text-white">Voorbeeld trade</h2>
            <p className="mt-1 text-xs text-gray-500">{exampleTrade.asset} · BUY</p>
            <p className="mt-2 rounded-lg border border-dark-500 bg-dark-700/50 px-3 py-2 text-xs text-gray-400 leading-relaxed">
              De bedragen (bijv. $2650) zijn de <strong className="text-gray-300">actuele prijs van goud</strong> in dollar per ounce (XAU/USD). Daar trade je op: je opent een BUY of SELL op dat prijsniveau, en zet daar je stop-loss en take-profits.
            </p>
            {verliesOverschrijdtKapitaal ? (
              <div className="mt-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                <strong>Verlies groter dan je kapitaal.</strong> Bij SL verlies je €{exampleTrade.exampleVerliesEur.toFixed(0)} terwijl je maar €{capital} hebt. Met dit kapitaal past maximaal <strong>{maxLotSizeVoorKapitaal} lot</strong>. Kies in de calculator een kleinere lot size of gebruik &quot;Gebruik lot size voor {slPercent}% risico&quot;.
              </div>
            ) : exampleTrade.exampleVerliesEur > result.riskPerTrade * 1.01 ? (
              <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Met <strong>{lotSize} lot</strong> is je verlies bij SL €{exampleTrade.exampleVerliesEur.toFixed(2)} — dat is meer dan je ingestelde risico (€{result.riskPerTrade.toFixed(2)}). Gebruik de knop &quot;Gebruik lot size voor {slPercent}% risico&quot; in de calculator om aan te sluiten.
              </div>
            ) : null}

            <div className="mt-4 flex gap-3">
              <div className="relative h-64 flex-1 min-w-0 rounded-lg bg-dark-700/80">
                <div className="absolute inset-0 flex flex-col">
                  <div style={{ height: `${100 - toPercent(exampleTrade.tp3)}%` }} className="border-b border-dark-600" />
                  <div
                    className={`flex items-center gap-2 border-b px-2 py-1.5 transition-colors ${tp3Hit ? 'border-green-400 bg-green-500/30' : 'border-green-500/40 bg-green-500/10'}`}
                    style={{ height: `${toPercent(exampleTrade.tp3) - toPercent(exampleTrade.tp2)}%` }}
                  >
                    <span className="text-xs font-medium text-green-400">TP3</span>
                    <span className="text-xs text-green-300">${exampleTrade.tp3}</span>
                    {tp3Hit && <span className="ml-auto text-xs font-bold text-green-300">✓ geraakt</span>}
                  </div>
                  <div
                    className={`flex items-center gap-2 border-b px-2 py-1.5 transition-colors ${tp2Hit ? 'border-green-400 bg-green-500/30' : 'border-green-500/30 bg-green-500/5'}`}
                    style={{ height: `${toPercent(exampleTrade.tp2) - toPercent(exampleTrade.tp1)}%` }}
                  >
                    <span className="text-xs font-medium text-green-400">TP2</span>
                    <span className="text-xs text-green-300">${exampleTrade.tp2}</span>
                    {tp2Hit && <span className="ml-auto text-xs font-bold text-green-300">✓ geraakt</span>}
                  </div>
                  <div
                    className={`flex items-center gap-2 border-b px-2 py-1.5 transition-colors ${tp1Hit ? 'border-green-400 bg-green-500/30' : 'border-green-500/30 bg-green-500/5'}`}
                    style={{ height: `${toPercent(exampleTrade.tp1) - toPercent(exampleTrade.entry)}%` }}
                  >
                    <span className="text-xs font-medium text-green-400">TP1</span>
                    <span className="text-xs text-green-300">${exampleTrade.tp1}</span>
                    {tp1Hit && <span className="ml-auto text-xs font-bold text-green-300">✓ geraakt</span>}
                  </div>
                  <div
                    className="flex items-center gap-2 border-b-2 border-accent bg-accent/20 px-2 py-2"
                    style={{ height: `${toPercent(exampleTrade.entry) - toPercent(exampleTrade.sl)}%` }}
                  >
                    <span className="text-xs font-bold text-accent">BUY</span>
                    <span className="text-xs font-semibold text-white">${exampleTrade.entry}</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 border-b px-2 py-1.5 transition-colors ${slHit ? 'border-red-400 bg-red-500/30' : 'border-red-500/40 bg-red-500/10'}`}
                    style={{ height: `${toPercent(exampleTrade.sl) - toPercent(priceMin)}%` }}
                  >
                    <span className="text-xs font-medium text-red-400">SL</span>
                    <span className="text-xs text-red-300">${exampleTrade.sl}</span>
                    {slHit && <span className="ml-auto text-xs font-bold text-red-300">✗ geraakt</span>}
                  </div>
                  <div className="flex-1" style={{ minHeight: `${toPercent(priceMin) - 0}%` }} />
                </div>
                {/* Bewegende prijs-indicator */}
                {(simPhase === 'win' || simPhase === 'loss') && (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center justify-center transition-all duration-300"
                    style={{ top: `${100 - toPercent(currentSimPrice)}%`, transform: 'translateY(-50%)' }}
                  >
                    <div className="flex items-center gap-1.5 rounded-full border-2 border-white/90 bg-dark-900 px-2.5 py-1 shadow-lg">
                      <span className="text-xs font-bold text-white">Prijs</span>
                      <span className="text-xs font-mono font-semibold text-accent">${currentSimPrice}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {simDone ? (
              <div className="mt-4 rounded-lg border-2 p-4 text-center">
                {simPhase === 'win' && (
                  <>
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <TrendingUp className="size-5" />
                      <span className="font-bold">Winst!</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-green-400">+€{exampleTrade.exampleWinstEur}</p>
                    <p className="mt-1 text-xs text-gray-400">TP1, TP2 en TP3 geraakt</p>
                  </>
                )}
                {simPhase === 'loss' && (
                  <>
                    <div className="flex items-center justify-center gap-2 text-red-400">
                      <TrendingDown className="size-5" />
                      <span className="font-bold">Verlies</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-red-400">−€{exampleTrade.exampleVerliesEur}</p>
                    <p className="mt-1 text-xs text-gray-400">Stop-loss geraakt</p>
                  </>
                )}
                <button
                  type="button"
                  onClick={resetSim}
                  className="mt-3 rounded-lg bg-dark-600 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-dark-500"
                >
                  Opnieuw
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={startSimWinst}
                    disabled={simRunning}
                    className="flex items-center justify-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 py-2.5 text-sm font-medium text-green-400 transition hover:bg-green-500/20 disabled:opacity-50"
                  >
                    <TrendingUp className="size-4" />
                    Voorbeeld trade winst
                  </button>
                  <button
                    type="button"
                    onClick={startSimVerlies}
                    disabled={simRunning}
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <TrendingDown className="size-4" />
                    Voorbeeld trade verlies
                  </button>
                </div>
                {simRunning && !simDone && (
                  <p className="mt-2 text-center text-xs text-gray-500">
                    {simPhase === 'win' ? 'Prijs beweegt naar TP1 → TP2 → TP3…' : 'Prijs beweegt naar SL…'}
                  </p>
                )}
              </>
            )}

            <p className="mt-4 text-xs text-gray-500">
              Entry: ${exampleTrade.entry} · SL: ${exampleTrade.sl} · TP1/2/3: ${exampleTrade.tp1}, ${exampleTrade.tp2}, ${exampleTrade.tp3}. Dit zijn de <span className="text-gray-400">goudprijzen (XAU/USD)</span> waarop je in- of uitstapt. Winst/verlies berekend met jouw <strong className="text-gray-400">{lotSize} lot</strong> uit de calculator.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-6">
          <h2 className="text-lg font-semibold text-white">Voorspelling</h2>
          <ul className="mt-4 space-y-3 text-gray-300">
            <li>
              <span className="text-gray-500">Risico per trade:</span>{' '}
              <span className="font-medium text-white">€{result.riskPerTrade.toFixed(2)}</span>
            </li>
            <li>
              <span className="text-gray-500">Mogelijke winst per trade (bij win):</span>{' '}
              <span className="font-medium text-white">€{result.rewardPerTrade.toFixed(2)}</span>
              <span className="ml-1 text-gray-500">(1:{rewardRatio})</span>
            </li>
            <li>
              <span className="text-gray-500">Verwacht resultaat per trade (gem.):</span>{' '}
              <span className="font-medium text-accent">€{result.expectedValuePerTrade.toFixed(2)}</span>
            </li>
            <li className="border-t border-dark-600 pt-3">
              <span className="text-gray-500">Trades nodig voor €{targetDaily}/dag:</span>{' '}
              <span className="text-xl font-bold text-accent">
                {result.tradesNeededForTarget != null ? result.tradesNeededForTarget : '—'}
              </span>
              {result.tradesNeededForTarget != null && (
                <span className="ml-1 text-gray-400">trades per dag</span>
              )}
            </li>
            <li>
              <span className="text-gray-500">Bij 10 trades/dag (indicatief):</span>{' '}
              <span className="font-medium text-white">€{result.expectedDailyIf10Trades.toFixed(2)}</span>
            </li>
            <li>
              <span className="text-gray-500">Bij 15 trades/dag (indicatief):</span>{' '}
              <span className="font-medium text-white">€{result.expectedDailyIf15Trades.toFixed(2)}</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-gray-500">
            Berekening op basis van jouw risk:reward (1:{rewardRatio}). &quot;Mogelijke winst per trade&quot; is bij één take-profit; bij meerdere TP&apos;s (zoals in de voorbeeldtrade) hangt de winst af van de afstanden. Geen beleggingsadvies; resultaten kunnen afwijken. Spread en commissie zijn niet meegenomen.
          </p>
        </div>
    </>
  )
}

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-dark-900 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-white">
            AI Trading.software
          </Link>
          <Link to="/" className="text-sm text-gray-400 hover:text-white">
            ← Terug
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white">Profitcalculator</h1>
        <p className="mt-2 text-gray-400">
          Stel de onderstaande waarden in. Bij elk veld staat een korte uitleg voor beginners.
        </p>
        <CalculatorContent showTradingUitleg />
      </div>
    </div>
  )
}
