import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function OnboardingNoticeBar() {
  const { user } = useAuth()
  if (!user) return null
  // Admin ziet geen onboarding-bar
  if (user.role === 'admin') return null
  // Toon bar bij status 'onboarding' of bij ontbrekende status (backwards compatibility)
  if (user.status !== 'onboarding' && user.status != null) return null

  return (
    <div
      className="flex shrink-0 items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/15 px-4 py-3 text-amber-200"
      role="status"
      aria-live="polite"
    >
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" aria-hidden />
      <span className="text-sm font-medium">
        Onboarding nog bezig
      </span>
      <span className="text-sm text-amber-200/90">
        – vul je MT5-gegevens in op het{' '}
        <Link to="/dashboard" className="underline underline-offset-2 hover:text-amber-100">
          dashboard
        </Link>
        .
      </span>
    </div>
  )
}
