const kpis = [
  { label: 'Balance', value: '€ 25.000,00', sub: 'Startkapitaal', positive: true },
  { label: 'P&L', value: '+ € 1.234,56', sub: '+4,9%', positive: true },
  { label: 'Open trades', value: '3', sub: 'Actieve posities', positive: null },
  { label: 'Win rate', value: '62%', sub: 'Laatste 30 dagen', positive: true },
]

export default function DashboardKpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map(({ label, value, sub, positive }) => (
        <div
          key={label}
          className="rounded-xl border border-dark-600 bg-dark-800/50 p-5 transition hover:border-dark-500"
        >
          <div className="text-sm font-medium text-gray-400">{label}</div>
          <div
            className={`mt-2 text-2xl font-bold ${
              positive === true
                ? 'text-accent'
                : positive === false
                  ? 'text-red-400'
                  : 'text-white'
            }`}
          >
            {value}
          </div>
          {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
        </div>
      ))}
    </div>
  )
}
