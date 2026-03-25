import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { PersonalAuthProvider } from './context/PersonalAuthContext'
import { usePersonalAuth } from './context/usePersonalAuth'
import LoginPage from './features/auth/LoginPage'
import TodayPage from './features/timetable'
import TrackPage from './features/track'
import ChatPage from './features/chatbot'
import DocumentsPage from './features/documents'
import SettingsPage from './features/settings'
import logo from './assets/logo.svg'

function AppInner() {
  const { userProfile } = usePersonalAuth()

  return (
    <div
      style={{
        minHeight: '100svh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: userProfile ? 80 : 0,
      }}
    >
      {userProfile ? (
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#f8fafc',
            padding: '14px 16px 10px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="Hum Honge Kamyaab" style={{ width: 28, height: 28 }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Hum Honge Kamyaab</div>
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
            Calm, structured daily management
          </div>
        </header>
      ) : null}

      <main style={{ padding: userProfile ? '14px 16px 24px' : 0, flex: 1 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TodayPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track"
            element={
              <ProtectedRoute>
                <TrackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={userProfile ? '/' : '/login'} replace />}
          />
        </Routes>
      </main>

      {userProfile ? <BottomNav /> : null}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <PersonalAuthProvider>
        <AppInner />
      </PersonalAuthProvider>
    </BrowserRouter>
  )
}
