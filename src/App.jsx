import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AuthProvider, useAuth } from "./auth/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import LoginPage from "./pages/LoginPage"

import AdminPanel from "./components/AdminPanel"
import EngineerPanel from "./components/EngineerPanel"
import StaffPanel from "./components/StaffPanel"
import TeamLeadPanel from "./components/TeamLeadPanel"

// Shared shell for every logged-in dashboard: title + who's logged in + Logout.
function DashboardLayout({ title, children }) {
  const { name, logout } = useAuth()

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary m-0" style={{ fontSize: "28px" }}>{title}</h1>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted">Hi, {name}</span>
          <button className="btn btn-outline-danger" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="card shadow-lg panel-card">
        <div className="card-body p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRole="DEPARTMENT_STAFF">
                <DashboardLayout title="Department Staff Dashboard">
                  <StaffPanel />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/engineer"
            element={
              <ProtectedRoute allowedRole="SUPPORT_ENGINEER">
                <DashboardLayout title="Support Engineer Dashboard">
                  <EngineerPanel />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teamlead"
            element={
              <ProtectedRoute allowedRole="TEAM_LEAD">
                <DashboardLayout title="Team Lead Dashboard">
                  <TeamLeadPanel />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <DashboardLayout title="Admin Dashboard">
                  <AdminPanel />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Anything else (including "/") -> back to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}