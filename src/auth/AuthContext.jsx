import { createContext, useContext, useState } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [token, setToken] = useState(localStorage.getItem("token"))
  const [role, setRole] = useState(localStorage.getItem("role"))
  const [userId, setUserId] = useState(localStorage.getItem("userId"))
  const [name, setName] = useState(localStorage.getItem("name"))
  const [department, setDepartment] = useState(localStorage.getItem("department"))

  // Called after a successful /auth/login response
  function login(data) {
    localStorage.setItem("token", data.access_token)
    localStorage.setItem("role", data.role)
    localStorage.setItem("userId", data.user_id)
    localStorage.setItem("name", data.name)
    localStorage.setItem("department", data.department)

    setToken(data.access_token)
    setRole(data.role)
    setUserId(data.user_id)
    setName(data.name)
    setDepartment(data.department)
  }

  function logout() {
    localStorage.clear()
    setToken(null)
    setRole(null)
    setUserId(null)
    setName(null)
    setDepartment(null)
  }

  return (
    <AuthContext.Provider value={{ token, role, userId, name, department, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}