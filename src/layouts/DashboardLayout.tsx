import { Outlet } from 'react-router-dom'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import OnboardingNoticeBar from '../components/dashboard/OnboardingNoticeBar'

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-dark-900">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col sm:pl-64">
        <OnboardingNoticeBar />
        <DashboardHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
