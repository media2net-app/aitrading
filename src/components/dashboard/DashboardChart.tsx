/**
 * Placeholder equity curve – simple SVG line chart.
 * Replace with a real chart library (e.g. recharts) when connecting to live data.
 */
const points = [
  [0, 80],
  [40, 75],
  [80, 85],
  [120, 70],
  [160, 90],
  [200, 85],
  [240, 95],
  [280, 88],
  [320, 100],
]
const pathD = points
  .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${100 - y}`)
  .join(' ')

export default function DashboardChart() {
  return (
    <div className="mt-6 h-64 w-full">
      <svg
        viewBox="0 0 320 100"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" x2="0" y1="1" y2="0">
            <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${pathD} L 320 100 L 0 100 Z`}
          fill="url(#chartGradient)"
        />
        <path
          d={pathD}
          fill="none"
          stroke="rgb(34, 197, 94)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
