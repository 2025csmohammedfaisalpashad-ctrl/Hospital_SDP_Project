import { Navigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"

export default function ProtectedRoute({ allowedRole, children }) {

  const { token, role } = useAuth()

  // Not logged in at all -> straight to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Logged in, but as the wrong role -> also back to login
  // (this is what stops a Support Engineer from just typing
  // /admin in the address bar)
  if (role !== allowedRole) {
    return <Navigate to="/login" replace />
  }

  return children
}