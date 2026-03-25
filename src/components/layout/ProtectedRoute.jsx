import { Navigate } from 'react-router-dom'
import { usePersonalAuth } from '../../context/PersonalAuthContext'

export default function ProtectedRoute({ children }) {
  const { loading, userProfile } = usePersonalAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    )
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />
  }

  return children
}

