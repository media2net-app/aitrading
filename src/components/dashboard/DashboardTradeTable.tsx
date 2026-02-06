const placeholderTrades = [
  { id: 1, pair: 'EUR/USD', type: 'Buy', volume: 0.1, open: 1.0845, current: 1.0862, pnl: '+17.00', time: '14:32' },
  { id: 2, pair: 'BTC/USD', type: 'Sell', volume: 0.01, open: 43250, current: 43180, pnl: '+7.00', time: '13:15' },
  { id: 3, pair: 'GBP/USD', type: 'Buy', volume: 0.05, open: 1.2620, current: 1.2610, pnl: '-5.00', time: '12:08' },
]

export default function DashboardTradeTable() {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-dark-600">
      <table className="min-w-full divide-y divide-dark-600">
        <thead>
          <tr className="bg-dark-700/50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Pair / Tijd
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              Type
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
              Volume
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
              Open
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
              Huidig
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
              P&L
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-600 bg-dark-800/30">
          {placeholderTrades.map((trade) => (
            <tr key={trade.id} className="text-gray-300">
              <td className="whitespace-nowrap px-4 py-3">
                <span className="font-medium text-white">{trade.pair}</span>
                <div className="text-xs text-gray-500">{trade.time}</div>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={
                    trade.type === 'Buy'
                      ? 'text-accent'
                      : 'text-amber-400'
                  }
                  >
                  {trade.type}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">{trade.volume}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">{trade.open}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">{trade.current}</td>
              <td
                className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                  trade.pnl.startsWith('+') ? 'text-accent' : 'text-red-400'
                }`}
              >
                {trade.pnl}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
