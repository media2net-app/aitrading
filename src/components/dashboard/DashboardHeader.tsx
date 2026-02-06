import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardHeader() {
  const { userEmail, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-dark-600 bg-dark-800 px-6">
      <div className="text-sm text-gray-400">Dashboard</div>
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
