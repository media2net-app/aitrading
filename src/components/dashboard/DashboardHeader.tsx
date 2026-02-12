import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardHeader() {
  const { userEmail, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const invoicePaid = user?.invoicePaid !== false

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkClass = (path: string, end?: boolean) => {
    const isActive = end ? location.pathname === path : location.pathname.startsWith(path)
    const disabled = !invoicePaid && path !== '/dashboard' && path !== '/dashboard/facturen'
    return `text-sm font-medium ${disabled ? 'cursor-not-allowed opacity-60 text-gray-500' : isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`
  }

  const canGo = (path: string) =>
    invoicePaid || path === '/dashboard' || path === '/dashboard/facturen'

  const isAdmin = user?.role === 'admin'
  const isLid = user?.role === 'lid'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-dark-600 bg-dark-800 px-4 sm:px-6">
      <nav className="flex flex-wrap items-center gap-4 sm:hidden">
        <NavLink to="/dashboard" end className={({ isActive: _ }) => navLinkClass('/dashboard', true)}>
          Dashboard
        </NavLink>
        {canGo('/dashboard/patronen') ? (
          <NavLink to="/dashboard/patronen" className={({ isActive: _ }) => navLinkClass('/dashboard/patronen')}>
            Patronen
          </NavLink>
        ) : (
          <span className={navLinkClass('/dashboard/patronen')}>Patronen</span>
        )}
        {canGo('/dashboard/analyse') ? (
          <NavLink to="/dashboard/analyse" className={({ isActive: _ }) => navLinkClass('/dashboard/analyse')}>
            Analyse
          </NavLink>
        ) : (
          <span className={navLinkClass('/dashboard/analyse')}>Analyse</span>
        )}
        {canGo('/dashboard/trade-bot') ? (
          <NavLink to="/dashboard/trade-bot" className={({ isActive: _ }) => navLinkClass('/dashboard/trade-bot')}>
            Trade bot
          </NavLink>
        ) : (
          <span className={navLinkClass('/dashboard/trade-bot')}>Trade bot</span>
        )}
        {isLid && (
          canGo('/dashboard/facturen') ? (
            <NavLink to="/dashboard/facturen" className={({ isActive: _ }) => navLinkClass('/dashboard/facturen')}>
              <span className="inline-flex items-center gap-1">
                Facturen
                <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-dark-900">
                  1
                </span>
              </span>
            </NavLink>
          ) : (
            <span className={navLinkClass('/dashboard/facturen')}>
              <span className="inline-flex items-center gap-1">
                Facturen
                <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-dark-900">
                  1
                </span>
              </span>
            </span>
          )
        )}
        {isAdmin && (
          canGo('/dashboard/users') ? (
            <NavLink to="/dashboard/users" className={({ isActive: _ }) => navLinkClass('/dashboard/users')}>
              Gebruikers
            </NavLink>
          ) : (
            <span className={navLinkClass('/dashboard/users')}>Gebruikers</span>
          )
        )}
        {canGo('/dashboard/downloads') ? (
          <NavLink to="/dashboard/downloads" className={({ isActive: _ }) => navLinkClass('/dashboard/downloads')}>
            Downloads
          </NavLink>
        ) : (
          <span className={navLinkClass('/dashboard/downloads')}>Downloads</span>
        )}
      </nav>
      <div className="hidden text-sm text-gray-400 sm:block" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-300">{userEmail}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-dark-500 px-3 py-1.5 text-sm text-gray-300 hover:bg-dark-600 hover:text-white"
        >
          Uitloggen
        </button>
      </div>
    </header>
  )
}
