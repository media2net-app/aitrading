import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardHeader() {
  const { userEmail, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-dark-600 bg-dark-800 px-4 sm:px-6">
      <nav className="flex gap-4 sm:hidden">
        <NavLink to="/dashboard" end className={navLinkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/dashboard/patronen" className={navLinkClass}>
          Patronen
        </NavLink>
        <NavLink to="/dashboard/analyse" className={navLinkClass}>
          Analyse
        </NavLink>
        <NavLink to="/dashboard/trade-bot" className={navLinkClass}>
          Trade bot
        </NavLink>
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
