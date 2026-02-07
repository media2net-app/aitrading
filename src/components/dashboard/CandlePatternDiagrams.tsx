import type { ReactNode } from 'react'

/**
 * SVG-diagrammen van candlestick-patronen voor educatieve uitleg.
 * Groen = bullish (slot > open), rood = bearish (slot < open).
 */
const green = '#22c55e'
const red = '#ef4444'
const gray = '#6b7280'

function CandleSvg({
  width = 100,
  height = 56,
  children,
  label,
}: {
  width?: number
  height?: number
  children: ReactNode
  label?: string
}) {
  return (
    <figure className="mt-3 flex shrink-0 flex-col items-center gap-1" style={{ minWidth: 200, minHeight: 120 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={240}
        height={120}
        className="block rounded border-2 border-dark-500 bg-dark-700 p-3"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-hidden="false"
      >
        {children}
      </svg>
      {label && <figcaption className="text-xs text-gray-400">{label}</figcaption>}
    </figure>
  )
}

/** Doji: zeer kleine body, wicks boven en onder */
export function DojiDiagram() {
  const cx = 50
  const y = 28
  return (
    <CandleSvg label="Doji">
      <line x1={cx} y1={8} x2={cx} y2={y - 2} stroke={gray} strokeWidth="2.5" />
      <line x1={cx} y1={y + 2} x2={cx} y2={48} stroke={gray} strokeWidth="2.5" />
      <rect x={cx - 5} y={y - 2} width={10} height={4} fill={gray} rx={1} />
    </CandleSvg>
  )
}

/** Hammer: kleine body bovenaan, lange onderste schaduw */
export function HammerDiagram() {
  const x = 40
  const bodyTop = 8
  const bodyH = 10
  const low = 48
  return (
    <CandleSvg label="Hammer (bullish)">
      <line x1={x + 8} y1={4} x2={x + 8} y2={bodyTop} stroke={green} strokeWidth="2.5" />
      <line x1={x + 8} y1={bodyTop + bodyH} x2={x + 8} y2={low} stroke={green} strokeWidth="2.5" />
      <rect x={x} y={bodyTop} width={18} height={bodyH} fill={green} rx={2} />
    </CandleSvg>
  )
}

/** Hanging man: zelfde vorm als hammer, maar bearish context */
export function HangingManDiagram() {
  const x = 40
  const bodyTop = 8
  const bodyH = 10
  const low = 48
  return (
    <CandleSvg label="Hanging man (bearish)">
      <line x1={x + 8} y1={4} x2={x + 8} y2={bodyTop} stroke={red} strokeWidth="2.5" />
      <line x1={x + 8} y1={bodyTop + bodyH} x2={x + 8} y2={low} stroke={red} strokeWidth="2.5" />
      <rect x={x} y={bodyTop} width={18} height={bodyH} fill={red} rx={2} />
    </CandleSvg>
  )
}

/** Bullish engulfing: kleine rode kaars, dan grote groene die deze omsluit */
export function BullishEngulfingDiagram() {
  const candleW = 14
  const gap = 4
  const c1x = 20
  const c2x = 20 + candleW + gap
  return (
    <CandleSvg width={80} label="Bullish engulfing">
      {/* Eerste kaars: klein, rood */}
      <rect x={c1x} y={18} width={candleW} height={20} fill={red} rx={1} />
      <line x1={c1x + candleW / 2} y1={12} x2={c1x + candleW / 2} y2={18} stroke={red} strokeWidth="2" />
      <line x1={c1x + candleW / 2} y1={38} x2={c1x + candleW / 2} y2={44} stroke={red} strokeWidth="2" />
      {/* Tweede kaars: groot, groen, omsluit eerste */}
      <rect x={c2x} y={10} width={candleW + 8} height={36} fill={green} rx={1} />
      <line x1={c2x + (candleW + 8) / 2} y1={4} x2={c2x + (candleW + 8) / 2} y2={10} stroke={green} strokeWidth="2" />
      <line x1={c2x + (candleW + 8) / 2} y1={46} x2={c2x + (candleW + 8) / 2} y2={52} stroke={green} strokeWidth="2" />
    </CandleSvg>
  )
}

/** Bearish engulfing: kleine groene kaars, dan grote rode die deze omsluit */
export function BearishEngulfingDiagram() {
  const candleW = 14
  const gap = 4
  const c1x = 20
  const c2x = 20 + candleW + gap
  return (
    <CandleSvg width={80} label="Bearish engulfing">
      <rect x={c1x} y={18} width={candleW} height={20} fill={green} rx={1} />
      <line x1={c1x + candleW / 2} y1={12} x2={c1x + candleW / 2} y2={18} stroke={green} strokeWidth="2" />
      <line x1={c1x + candleW / 2} y1={38} x2={c1x + candleW / 2} y2={44} stroke={green} strokeWidth="2" />
      <rect x={c2x} y={10} width={candleW + 8} height={36} fill={red} rx={1} />
      <line x1={c2x + (candleW + 8) / 2} y1={4} x2={c2x + (candleW + 8) / 2} y2={10} stroke={red} strokeWidth="2" />
      <line x1={c2x + (candleW + 8) / 2} y1={46} x2={c2x + (candleW + 8) / 2} y2={52} stroke={red} strokeWidth="2" />
    </CandleSvg>
  )
}

/** Morning star: rode kaars, kleine body (ster), grote groene kaars */
export function MorningStarDiagram() {
  const w = 12
  const gap = 3
  const x1 = 8
  const x2 = 8 + w + gap
  const x3 = 8 + (w + gap) * 2
  return (
    <CandleSvg width={60} label="Morning star (bullish)">
      <rect x={x1} y={14} width={w} height={28} fill={red} rx={1} />
      <line x1={x1 + w / 2} y1={6} x2={x1 + w / 2} y2={14} stroke={red} strokeWidth="2" />
      <line x1={x1 + w / 2} y1={42} x2={x1 + w / 2} y2={50} stroke={red} strokeWidth="2" />
      <rect x={x2 + 2} y={26} width={w - 4} height={4} fill={gray} rx={0.5} />
      <line x1={x2 + w / 2} y1={10} x2={x2 + w / 2} y2={26} stroke={gray} strokeWidth="2" />
      <line x1={x2 + w / 2} y1={30} x2={x2 + w / 2} y2={46} stroke={gray} strokeWidth="2" />
      <rect x={x3} y={8} width={w} height={36} fill={green} rx={1} />
      <line x1={x3 + w / 2} y1={2} x2={x3 + w / 2} y2={8} stroke={green} strokeWidth="2" />
      <line x1={x3 + w / 2} y1={44} x2={x3 + w / 2} y2={54} stroke={green} strokeWidth="2" />
    </CandleSvg>
  )
}

/** Evening star: groene kaars, kleine body, grote rode kaars */
export function EveningStarDiagram() {
  const w = 12
  const gap = 3
  const x1 = 8
  const x2 = 8 + w + gap
  const x3 = 8 + (w + gap) * 2
  return (
    <CandleSvg width={60} label="Evening star (bearish)">
      <rect x={x1} y={8} width={w} height={36} fill={green} rx={1} />
      <line x1={x1 + w / 2} y1={2} x2={x1 + w / 2} y2={8} stroke={green} strokeWidth="2" />
      <line x1={x1 + w / 2} y1={44} x2={x1 + w / 2} y2={54} stroke={green} strokeWidth="2" />
      <rect x={x2 + 2} y={26} width={w - 4} height={4} fill={gray} rx={0.5} />
      <line x1={x2 + w / 2} y1={10} x2={x2 + w / 2} y2={26} stroke={gray} strokeWidth="2" />
      <line x1={x2 + w / 2} y1={30} x2={x2 + w / 2} y2={46} stroke={gray} strokeWidth="2" />
      <rect x={x3} y={14} width={w} height={28} fill={red} rx={1} />
      <line x1={x3 + w / 2} y1={6} x2={x3 + w / 2} y2={14} stroke={red} strokeWidth="2" />
      <line x1={x3 + w / 2} y1={42} x2={x3 + w / 2} y2={50} stroke={red} strokeWidth="2" />
    </CandleSvg>
  )
}
