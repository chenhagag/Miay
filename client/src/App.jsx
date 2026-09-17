import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import AiChatPanel from './components/AiChatPanel'
import DashboardPage from './pages/DashboardPage'
import MyTasksPage from './pages/MyTasksPage'
import PartnerTasksPage from './pages/PartnerTasksPage'
import AllTasksPage from './pages/AllTasksPage'
import UnassignedPage from './pages/UnassignedPage'
import ComparisonPage from './pages/ComparisonPage'
import SetupPage from './pages/SetupPage'
import LoginPage from './pages/LoginPage'
import { Loader2 } from 'lucide-react'

function AppContent() {
  const { user, loading } = useAuth()
  const [showSetup, setShowSetup] = useState(true)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">טוען...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (showSetup) {
      return <SetupPage onSwitch={() => setShowSetup(false)} />
    }
    return <LoginPage onSwitch={() => setShowSetup(true)} />
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar (right side in RTL) */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-4xl">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/my-tasks" element={<MyTasksPage />} />
          <Route path="/partner-tasks" element={<PartnerTasksPage />} />
          <Route path="/all-tasks" element={<AllTasksPage />} />
          <Route path="/unassigned" element={<UnassignedPage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
        </Routes>
      </main>

      {/* Mobile bottom nav */}
      <Sidebar mobile />

      {/* AI Chat */}
      <AiChatPanel />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
