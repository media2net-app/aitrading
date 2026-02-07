import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/dashboard/patronen', label: 'Patronen', end: false },
  { to: '/dashboard/analyse', label: 'Analyse', end: false },
]

export default function DashboardSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-full w-64 border-r border-dark-600 bg-dark-800 sm:block">
      <div className="flex h-16 items-center border-b border-dark-600 px-6">
        <span className="text-lg font-semibold text-white">AI Trading.software</span>
      </div>
      <nav className="p-4">
        {navItems.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `block bg-transparent px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? 'text-white' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
