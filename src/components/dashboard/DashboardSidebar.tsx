import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Overzicht' },
  { to: '/dashboard#equity', label: 'Equity curve' },
  { to: '/dashboard#trades', label: 'Recente trades' },
]

export default function DashboardSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-full w-64 border-r border-dark-600 bg-dark-800 lg:block">
      <div className="flex h-16 items-center border-b border-dark-600 px-6">
        <span className="text-lg font-semibold text-white">AI Trading.software</span>
      </div>
      <nav className="p-4">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/20 text-accent'
                  : 'text-gray-400 hover:bg-dark-600 hover:text-white'
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
