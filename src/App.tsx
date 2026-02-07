import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import AgreementPage from './pages/AgreementPage'
import CalculatorPage from './pages/CalculatorPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import PatronenPage from './pages/PatronenPage'
import AnalysePage from './pages/AnalysePage'
import RegisterPage from './pages/RegisterPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900">
        <p className="text-gray-400">Laden...</p>
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/agreement" element={<AgreementPage />} />
      <Route path="/calculator" element={<CalculatorPage />} />
      <Route path="/patronen" element={
        <div className="min-h-screen bg-dark-900 p-4 sm:p-6">
          <a href="/" className="mb-4 inline-block text-sm text-gray-400 hover:text-white">← Terug naar home</a>
          <PatronenPage />
        </div>
      } />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="patronen" element={<PatronenPage />} />
        <Route path="analyse" element={<AnalysePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
