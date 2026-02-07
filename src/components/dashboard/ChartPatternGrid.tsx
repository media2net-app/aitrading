import type { ReactNode } from 'react'

/**
 * Forex chart patterns in infographic style: title, type label, diagram.
 * Orange = price line, blue = support/resistance, numbered points.
 */
const orange = '#f97316'
const blue = '#3b82f6'
const blueDashed = '#60a5fa'
const white = '#e5e7eb'

const vbW = 180
const vbH = 90

function PatternCard({
  title,
  typeLabel,
  children,
}: {
  title: string
  typeLabel: string
  children: ReactNode
}) {
  return (
    <article className="flex flex-col rounded-xl border border-dark-600 bg-dark-800/80 p-4">
      <h3 className="text-sm font-bold uppercase leading-tight text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-gray-400">({typeLabel})</p>
      <div className="mt-3 flex flex-1 items-center justify-center">
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          className="h-24 w-full max-w-full shrink-0 rounded border border-dark-600 bg-dark-700/50 p-1 sm:h-28"
          preserveAspectRatio="xMidYMid meet"
        >
          {children}
        </svg>
      </div>
    </article>
  )
}

/** Numbered point on the chart */
function Pt({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={7} fill={blue} stroke={white} strokeWidth="1" />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fill={white} fontSize={10} fontWeight="bold">{n}</text>
    </g>
  )
}

/** Polyline for price (orange) */
function PriceLine({ points }: { points: string }) {
  return <polyline points={points} fill="none" stroke={orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
}

/** Line for S/R (blue, optional dashed) */
function StructLine({ x1, y1, x2, y2, dashed }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={dashed ? blueDashed : blue} strokeWidth="1.5" strokeDasharray={dashed ? '4 3' : undefined} />
  )
}

/** Arrow for trend direction */
function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const ax = x2 - 8 * ux + 4 * uy
  const ay = y2 - 8 * uy - 4 * ux
  const bx = x2 - 8 * ux - 4 * uy
  const by = y2 - 8 * uy + 4 * ux
  return (
    <g stroke={blueDashed} strokeWidth="1" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray="3 2" />
      <polygon points={`${x2},${y2} ${ax},${ay} ${bx},${by}`} fill={blueDashed} stroke="none" />
    </g>
  )
}

export function SymmetricalTriangleBullish() {
  return (
    <PatternCard title="Symmetrical triangle" typeLabel="Continuation – Bullish variant">
      <StructLine x1={20} y1={15} x2={160} y2={45} />
      <StructLine x1={20} y1={75} x2={160} y2={45} />
      <PriceLine points="20,45 50,35 80,48 110,38 140,45 165,45" />
      <Pt x={20} y={45} n={1} />
      <Pt x={80} y={48} n={2} />
      <Pt x={140} y={45} n={3} />
      <Arrow x1={20} y1={60} x2={90} y2={60} />
      <Arrow x1={170} y1={30} x2={170} y2={15} />
    </PatternCard>
  )
}

export function AscendingTriangle() {
  return (
    <PatternCard title="Ascending triangle" typeLabel="Continuation – Bullish only">
      <StructLine x1={20} y1={25} x2={160} y2={25} />
      <StructLine x1={20} y1={75} x2={160} y2={45} />
      <PriceLine points="20,50 55,42 90,35 125,28 160,25 165,25" />
      <Pt x={20} y={50} n={1} />
      <Pt x={90} y={35} n={2} />
      <Pt x={160} y={25} n={3} />
      <Arrow x1={20} y1={65} x2={90} y2={65} />
      <Arrow x1={170} y1={35} x2={170} y2={15} />
    </PatternCard>
  )
}

export function InverseHeadAndShoulders() {
  return (
    <PatternCard title="Inverse head and shoulders" typeLabel="Reversal – Bullish only">
      <StructLine x1={20} y1={55} x2={160} y2={55} />
      <PriceLine points="20,45 45,52 70,35 95,52 120,42 145,52 170,48" />
      <Pt x={45} y={52} n={1} />
      <Pt x={70} y={35} n={2} />
      <Pt x={95} y={52} n={3} />
      <Pt x={120} y={42} n={4} />
      <Arrow x1={20} y1={75} x2={70} y2={75} />
      <Arrow x1={170} y1={35} x2={170} y2={15} />
    </PatternCard>
  )
}

export function CupAndHandle() {
  return (
    <PatternCard title="Cup and handle" typeLabel="Continuation – Bullish only">
      <StructLine x1={20} y1={30} x2={160} y2={30} />
      <PriceLine points="20,30 50,65 80,42 110,55 140,35 165,28" />
      <Pt x={20} y={30} n={1} />
      <Pt x={80} y={42} n={2} />
      <Pt x={140} y={35} n={3} />
      <Arrow x1={20} y1={15} x2={80} y2={15} />
      <Arrow x1={170} y1={45} x2={170} y2={20} />
    </PatternCard>
  )
}

export function FallingWedge() {
  return (
    <PatternCard title="Falling wedge" typeLabel="Neutral – Bullish only">
      <StructLine x1={20} y1={20} x2={160} y2={50} />
      <StructLine x1={20} y1={70} x2={160} y2={55} />
      <PriceLine points="20,45 55,42 90,48 125,50 160,52 165,45" />
      <Pt x={20} y={45} n={1} />
      <Pt x={90} y={48} n={2} />
      <Pt x={160} y={52} n={3} />
      <Arrow x1={20} y1={75} x2={90} y2={75} />
      <Arrow x1={170} y1={50} x2={170} y2={25} />
    </PatternCard>
  )
}

export function SymmetricalTriangleBearish() {
  return (
    <PatternCard title="Symmetrical triangle" typeLabel="Continuation – Bearish variant">
      <StructLine x1={20} y1={45} x2={160} y2={15} />
      <StructLine x1={20} y1={45} x2={160} y2={75} />
      <PriceLine points="20,45 50,55 80,42 110,52 140,45 165,45" />
      <Pt x={20} y={45} n={1} />
      <Pt x={80} y={42} n={2} />
      <Pt x={140} y={45} n={3} />
      <Arrow x1={20} y1={30} x2={90} y2={30} />
      <Arrow x1={170} y1={60} x2={170} y2={75} />
    </PatternCard>
  )
}

export function DescendingTriangle() {
  return (
    <PatternCard title="Descending triangle" typeLabel="Continuation – Bearish only">
      <StructLine x1={20} y1={65} x2={160} y2={65} />
      <StructLine x1={20} y1={25} x2={160} y2={45} />
      <PriceLine points="20,40 55,48 90,55 125,60 160,65 165,65" />
      <Pt x={20} y={40} n={1} />
      <Pt x={90} y={55} n={2} />
      <Pt x={160} y={65} n={3} />
      <Arrow x1={20} y1={25} x2={90} y2={25} />
      <Arrow x1={170} y1={55} x2={170} y2={75} />
    </PatternCard>
  )
}

export function HeadAndShoulders() {
  return (
    <PatternCard title="Head and shoulders" typeLabel="Reversal – Bearish only">
      <StructLine x1={20} y1={35} x2={160} y2={35} />
      <PriceLine points="20,45 45,38 70,55 95,38 120,48 145,38 170,42" />
      <Pt x={45} y={38} n={1} />
      <Pt x={70} y={55} n={2} />
      <Pt x={95} y={38} n={3} />
      <Pt x={120} y={48} n={4} />
      <Arrow x1={20} y1={15} x2={70} y2={15} />
      <Arrow x1={170} y1={55} x2={170} y2={75} />
    </PatternCard>
  )
}

export function InverseCupAndHandle() {
  return (
    <PatternCard title="Inverse cup and handle" typeLabel="Continuation – Bearish only">
      <StructLine x1={20} y1={60} x2={160} y2={60} />
      <PriceLine points="20,60 50,25 80,48 110,35 140,55 165,62" />
      <Pt x={20} y={60} n={1} />
      <Pt x={80} y={48} n={2} />
      <Pt x={140} y={55} n={3} />
      <Arrow x1={20} y1={75} x2={80} y2={75} />
      <Arrow x1={170} y1={45} x2={170} y2={70} />
    </PatternCard>
  )
}

export function RisingWedge() {
  return (
    <PatternCard title="Rising wedge" typeLabel="Neutral – Bearish only">
      <StructLine x1={20} y1={70} x2={160} y2={40} />
      <StructLine x1={20} y1={20} x2={160} y2={35} />
      <PriceLine points="20,45 55,48 90,42 125,45 160,38 165,45" />
      <Pt x={20} y={45} n={1} />
      <Pt x={90} y={42} n={2} />
      <Pt x={160} y={38} n={3} />
      <Arrow x1={20} y1={15} x2={90} y2={15} />
      <Arrow x1={170} y1={40} x2={170} y2={65} />
    </PatternCard>
  )
}

export function RectangleBullish() {
  return (
    <PatternCard title="Rectangle" typeLabel="Continuation – Bullish variant">
      <StructLine x1={20} y1={25} x2={160} y2={25} />
      <StructLine x1={20} y1={65} x2={160} y2={65} />
      <PriceLine points="20,45 60,28 100,62 140,30 165,25" />
      <Pt x={20} y={45} n={1} />
      <Pt x={100} y={62} n={2} />
      <Pt x={140} y={30} n={3} />
      <Arrow x1={20} y1={15} x2={80} y2={15} />
      <Arrow x1={170} y1={45} x2={170} y2={20} />
    </PatternCard>
  )
}

export function FlagBullish() {
  return (
    <PatternCard title="Flag" typeLabel="Continuation – Bullish variant">
      <PriceLine points="20,70 40,65 60,25 65,35 90,42 115,38 140,35 165,30" />
      <StructLine x1={65} y1={35} x2={140} y2={38} />
      <StructLine x1={65} y1={50} x2={140} y2={48} />
      <Pt x={60} y={25} n={1} />
      <Pt x={65} y={35} n={2} />
      <Pt x={140} y={38} n={3} />
      <Arrow x1={20} y1={75} x2={50} y2={75} />
      <Arrow x1={170} y1={42} x2={170} y2={20} />
    </PatternCard>
  )
}

export function PennantBullish() {
  return (
    <PatternCard title="Pennant" typeLabel="Continuation – Bullish variant">
      <PriceLine points="20,70 45,30 55,42 85,45 115,44 145,42 165,35" />
      <StructLine x1={55} y1={42} x2={145} y2={38} />
      <StructLine x1={55} y1={55} x2={145} y2={50} />
      <Pt x={45} y={30} n={1} />
      <Pt x={55} y={42} n={2} />
      <Pt x={145} y={42} n={3} />
      <Arrow x1={20} y1={75} x2={50} y2={75} />
      <Arrow x1={170} y1={45} x2={170} y2={25} />
    </PatternCard>
  )
}

export function DoubleBottom() {
  return (
    <PatternCard title="Double bottom" typeLabel="Reversal – Bullish only">
      <StructLine x1={20} y1={45} x2={160} y2={45} />
      <PriceLine points="20,35 50,60 80,38 110,58 140,40 165,35" />
      <Pt x={50} y={60} n={1} />
      <Pt x={80} y={38} n={2} />
      <Pt x={110} y={58} n={3} />
      <Arrow x1={20} y1={75} x2={65} y2={75} />
      <Arrow x1={170} y1={25} x2={170} y2={10} />
    </PatternCard>
  )
}

export function TripleBottom() {
  return (
    <PatternCard title="Triple bottom" typeLabel="Reversal – Bullish only">
      <StructLine x1={20} y1={42} x2={160} y2={42} />
      <PriceLine points="20,35 40,58 60,40 85,56 105,38 130,55 150,38 165,32" />
      <Pt x={40} y={58} n={1} />
      <Pt x={60} y={40} n={2} />
      <Pt x={85} y={56} n={3} />
      <Pt x={105} y={38} n={4} />
      <Pt x={130} y={55} n={5} />
      <Arrow x1={20} y1={75} x2={75} y2={75} />
      <Arrow x1={170} y1={25} x2={170} y2={10} />
    </PatternCard>
  )
}

export function RectangleBearish() {
  return (
    <PatternCard title="Rectangle" typeLabel="Continuation – Bearish variant">
      <StructLine x1={20} y1={25} x2={160} y2={25} />
      <StructLine x1={20} y1={65} x2={160} y2={65} />
      <PriceLine points="20,45 60,62 100,28 140,58 165,65" />
      <Pt x={20} y={45} n={1} />
      <Pt x={100} y={28} n={2} />
      <Pt x={140} y={58} n={3} />
      <Arrow x1={20} y1={15} x2={80} y2={15} />
      <Arrow x1={170} y1={45} x2={170} y2={70} />
    </PatternCard>
  )
}

export function FlagBearish() {
  return (
    <PatternCard title="Flag" typeLabel="Continuation – Bearish variant">
      <PriceLine points="20,20 40,25 60,65 65,55 90,48 115,52 140,55 165,60" />
      <StructLine x1={65} y1={55} x2={140} y2={52} />
      <StructLine x1={65} y1={42} x2={140} y2={45} />
      <Pt x={60} y={65} n={1} />
      <Pt x={65} y={55} n={2} />
      <Pt x={140} y={52} n={3} />
      <Arrow x1={20} y1={15} x2={50} y2={15} />
      <Arrow x1={170} y1={48} x2={170} y2={70} />
    </PatternCard>
  )
}

export function PennantBearish() {
  return (
    <PatternCard title="Pennant" typeLabel="Continuation – Bearish variant">
      <PriceLine points="20,20 45,60 55,48 85,45 115,46 145,48 165,55" />
      <StructLine x1={55} y1={48} x2={145} y2={52} />
      <StructLine x1={55} y1={35} x2={145} y2={40} />
      <Pt x={45} y={60} n={1} />
      <Pt x={55} y={48} n={2} />
      <Pt x={145} y={48} n={3} />
      <Arrow x1={20} y1={15} x2={50} y2={15} />
      <Arrow x1={170} y1={45} x2={170} y2={65} />
    </PatternCard>
  )
}

export function DoubleTop() {
  return (
    <PatternCard title="Double top" typeLabel="Reversal – Bearish only">
      <StructLine x1={20} y1={45} x2={160} y2={45} />
      <PriceLine points="20,55 50,30 80,52 110,32 140,50 165,55" />
      <Pt x={50} y={30} n={1} />
      <Pt x={80} y={52} n={2} />
      <Pt x={110} y={32} n={3} />
      <Arrow x1={20} y1={15} x2={65} y2={15} />
      <Arrow x1={170} y1={65} x2={170} y2={80} />
    </PatternCard>
  )
}

export function TripleTop() {
  return (
    <PatternCard title="Triple top" typeLabel="Reversal – Bearish only">
      <StructLine x1={20} y1={48} x2={160} y2={48} />
      <PriceLine points="20,55 40,32 60,50 85,35 105,52 130,36 150,52 165,58" />
      <Pt x={40} y={32} n={1} />
      <Pt x={60} y={50} n={2} />
      <Pt x={85} y={35} n={3} />
      <Pt x={105} y={52} n={4} />
      <Pt x={130} y={36} n={5} />
      <Arrow x1={20} y1={15} x2={75} y2={15} />
      <Arrow x1={170} y1={65} x2={170} y2={80} />
    </PatternCard>
  )
}
