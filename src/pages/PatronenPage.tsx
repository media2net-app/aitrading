import {
  SymmetricalTriangleBullish,
  AscendingTriangle,
  InverseHeadAndShoulders,
  CupAndHandle,
  FallingWedge,
  SymmetricalTriangleBearish,
  DescendingTriangle,
  HeadAndShoulders,
  InverseCupAndHandle,
  RisingWedge,
  RectangleBullish,
  FlagBullish,
  PennantBullish,
  DoubleBottom,
  TripleBottom,
  RectangleBearish,
  FlagBearish,
  PennantBearish,
  DoubleTop,
  TripleTop,
} from '../components/dashboard/ChartPatternGrid'
import {
  DojiDiagram,
  HammerDiagram,
  HangingManDiagram,
  BullishEngulfingDiagram,
  BearishEngulfingDiagram,
  MorningStarDiagram,
  EveningStarDiagram,
} from '../components/dashboard/CandlePatternDiagrams'

const chartPatterns = [
  SymmetricalTriangleBullish,
  AscendingTriangle,
  InverseHeadAndShoulders,
  CupAndHandle,
  FallingWedge,
  SymmetricalTriangleBearish,
  DescendingTriangle,
  HeadAndShoulders,
  InverseCupAndHandle,
  RisingWedge,
  RectangleBullish,
  FlagBullish,
  PennantBullish,
  DoubleBottom,
  TripleBottom,
  RectangleBearish,
  FlagBearish,
  PennantBearish,
  DoubleTop,
  TripleTop,
]

export default function PatronenPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
          Forex chart patterns
        </h1>
        <p className="mt-2 text-gray-400">
          Overzicht van grafiekpatronen met type (continuation, reversal, neutral) en richting (bullish/bearish). Oranje lijn = koers, blauw = support/resistance, genummerde punten = belangrijke levels.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Chart patterns (20)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {chartPatterns.map((Pattern, i) => (
            <Pattern key={i} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <h2 className="text-lg font-semibold text-white">Candlestick-patronen</h2>
        <p className="mt-1 text-sm text-gray-400">
          Patronen gevormd door één of meer kaarsen op de grafiek. Groen = bullish, rood = bearish.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 p-4">
            <h3 className="font-medium text-white">Doji</h3>
            <DojiDiagram />
            <p className="mt-2 text-sm text-gray-400">Zeer kleine body, onzekerheid; kan omkering signaleren.</p>
          </div>
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 p-4">
            <h3 className="font-medium text-white">Hammer / Hanging man</h3>
            <div className="mt-2 flex flex-wrap gap-4">
              <HammerDiagram />
              <HangingManDiagram />
            </div>
            <p className="mt-2 text-sm text-gray-400">Kleine body, lange onderste schaduw; hammer bullish, hanging man bearish.</p>
          </div>
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 p-4">
            <h3 className="font-medium text-white">Engulfing</h3>
            <div className="mt-2 flex flex-wrap gap-4">
              <BullishEngulfingDiagram />
              <BearishEngulfingDiagram />
            </div>
            <p className="mt-2 text-sm text-gray-400">Volgende kaars omsluit de vorige; bullish of bearish.</p>
          </div>
          <div className="rounded-lg border border-dark-600 bg-dark-800/30 p-4 sm:col-span-2 lg:col-span-3">
            <h3 className="font-medium text-white">Morning star / Evening star</h3>
            <div className="mt-2 flex flex-wrap gap-6">
              <MorningStarDiagram />
              <EveningStarDiagram />
            </div>
            <p className="mt-2 text-sm text-gray-400">Drie kaarsen: morning star bullish omkering, evening star bearish.</p>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-gray-500">
        Educatief. Patronen geven geen garantie; combineer met andere analyse en risicobeheer.
      </p>
    </div>
  )
}
