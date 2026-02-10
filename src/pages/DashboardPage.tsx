import { useAuth } from '../contexts/AuthContext'
import DashboardKpiCards from '../components/dashboard/DashboardKpiCards'
import DashboardChart from '../components/dashboard/DashboardChart'
import DashboardTradeTable from '../components/dashboard/DashboardTradeTable'
import DashboardStatusCard from '../components/dashboard/DashboardStatusCard'
import OnboardingMT5Form from '../components/dashboard/OnboardingMT5Form'

export default function DashboardPage() {
  const { user } = useAuth()
  const isOnboarding = user?.status === 'onboarding'

  if (isOnboarding) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Onboarding</h1>
          <p className="mt-1 text-gray-400">
            Vul je MT5-gegevens in. Het dashboard blijft leeg tot je account actief is.
          </p>
        </div>
        <OnboardingMT5Form />
      </div>
    )
  }

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
