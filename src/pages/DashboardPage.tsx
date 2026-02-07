import DashboardKpiCards from '../components/dashboard/DashboardKpiCards'
import DashboardChart from '../components/dashboard/DashboardChart'
import DashboardTradeTable from '../components/dashboard/DashboardTradeTable'
import DashboardStatusCard from '../components/dashboard/DashboardStatusCard'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overzicht</h1>
        <p className="mt-1 text-gray-400">
          Je account en prestaties in één oogopslag.
        </p>
      </div>

      <DashboardStatusCard />

      <DashboardKpiCards />

      <section id="equity" className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <h2 className="text-lg font-semibold text-white">Equity curve</h2>
        <p className="mt-1 text-sm text-gray-400">
          Performance over tijd (placeholder – koppel later aan echte data)
        </p>
        <DashboardChart />
      </section>

      <section id="trades" className="rounded-xl border border-dark-600 bg-dark-800/50 p-6">
        <h2 className="text-lg font-semibold text-white">Recente trades</h2>
        <p className="mt-1 text-sm text-gray-400">
          Laatste activiteit (placeholder – koppel later aan echte data)
        </p>
        <DashboardTradeTable />
      </section>
    </div>
  )
}
