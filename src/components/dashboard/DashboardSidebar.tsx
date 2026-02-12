import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

type NavItem = { to: string; label: string; end: boolean; badge?: number }

export default function DashboardSidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'
  const isLid = user?.role === 'lid'
  const invoicePaid = user?.invoicePaid !== false // alleen Dashboard + Facturen klikbaar als onbetaald

  const mainItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', end: true },
    { to: '/dashboard/patronen', label: 'Patronen', end: false },
    { to: '/dashboard/analyse', label: 'Analyse', end: false },
    { to: '/dashboard/trade-bot', label: 'Trade bot', end: false },
    ...(isLid ? [{ to: '/dashboard/facturen', label: 'Facturen', end: false, badge: 1 }] : []),
    ...(isAdmin ? [{ to: '/dashboard/users', label: 'Gebruikers (admin)', end: false }] : []),
  ]
  const downloadsItem: NavItem = { to: '/dashboard/downloads', label: 'Downloads', end: false }

  const canNavigate = (to: string) => {
    if (invoicePaid) return true
    const path = to === '/dashboard' ? '/dashboard' : to
    return path === '/dashboard' || path === '/dashboard/facturen'
  }

  const linkClass = (to: string, end: boolean) => {
    const isActive = end ? location.pathname === to : location.pathname.startsWith(to)
    const disabled = !canNavigate(to)
    return `flex items-center justify-between bg-transparent px-4 py-3 text-sm font-medium transition-colors ${
      disabled ? 'cursor-not-allowed opacity-60 text-gray-500' : isActive ? 'text-white' : 'text-gray-400 hover:text-white'
    }`
  }

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-full w-64 border-r border-dark-600 bg-dark-800 sm:block">
      <div className="flex h-16 items-center border-b border-dark-600 px-6">
        <span className="text-lg font-semibold text-white">AI Trading.software</span>
      </div>
      <nav className="flex h-full flex-col p-4">
        <div className="flex-1">
          {mainItems.map(({ to, label, end, badge }) =>
            canNavigate(to) ? (
              <NavLink key={to} to={to} end={end} className={({ isActive: _ }) => linkClass(to, end)}>
                <span>{label}</span>
                {badge != null && badge > 0 && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-dark-900">
                    {badge}
                  </span>
                )}
              </NavLink>
            ) : (
              <span key={to} className={linkClass(to, end)}>
                <span>{label}</span>
                {badge != null && badge > 0 && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-dark-900">
                    {badge}
                  </span>
                )}
              </span>
            )
          )}
        </div>
        <div className="border-t border-dark-600 pt-4">
          {canNavigate(downloadsItem.to) ? (
            <NavLink to={downloadsItem.to} end={downloadsItem.end} className={({ isActive: _ }) => linkClass(downloadsItem.to, downloadsItem.end)}>
              {downloadsItem.label}
            </NavLink>
          ) : (
            <span className={linkClass(downloadsItem.to, downloadsItem.end)}>{downloadsItem.label}</span>
          )}
        </div>
      </nav>
    </aside>
  )
}
