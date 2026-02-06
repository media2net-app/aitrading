import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'

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
}

export default function CalculatorPage() {
  const [capital, setCapital] = useState(500)
  const [slPercent, setSlPercent] = useState(2)
  const [winRatePercent, setWinRatePercent] = useState(90)
  const [rewardRatio, setRewardRatio] = useState(1)
  const [targetDaily, setTargetDaily] = useState(100)

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

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-8">
      <div className="mx-auto max-w-lg">
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

        <div className="mt-8 space-y-6 rounded-xl border border-dark-600 bg-dark-800 p-6">
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
            Berekening op basis van jouw risk:reward (1:{rewardRatio}). Geen beleggingsadvies; resultaten kunnen afwijken.
          </p>
        </div>
      </div>
    </div>
  )
}
