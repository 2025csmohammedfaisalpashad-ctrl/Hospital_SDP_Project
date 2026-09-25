import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { apiLogin, apiRegister } from "../api"
import { useAuth } from "../auth/AuthContext"

import hospitalImage from "../assets/hospital.jpeg"

import "./LoginPage.css"


// ============================================================
// ROLE → DASHBOARD
// ============================================================

const ROLE_TO_PATH = {
  DEPARTMENT_STAFF: "/staff",
  SUPPORT_ENGINEER: "/engineer",
  TEAM_LEAD: "/teamlead",
  ADMIN: "/admin",
}


// ============================================================
// ROLE OPTIONS
// ============================================================

const ROLE_OPTIONS = [
  {
    value: "DEPARTMENT_STAFF",
    label: "Staff Member",
  },
  {
    value: "SUPPORT_ENGINEER",
    label: "Support Engineer",
  },
  {
    value: "TEAM_LEAD",
    label: "Team Lead",
  },
  {
    value: "ADMIN",
    label: "Admin",
  },
]


export default function LoginPage() {

  const navigate = useNavigate()
  const { login } = useAuth()


  // ==========================================================
  // LOGIN / REGISTER MODE
  // ==========================================================

  const [isRegister, setIsRegister] = useState(false)


  // ==========================================================
  // LOGIN
  // ==========================================================

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")


  // ==========================================================
  // REGISTER
  // ==========================================================

  const [userId, setUserId] = useState("")
  const [name, setName] = useState("")
  const [registerUsername, setRegisterUsername] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("")


  // ==========================================================
  // COMMON STATE
  // ==========================================================

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)


  // ==========================================================
  // SWITCH TO REGISTER
  // ==========================================================

  function openRegister() {

    setIsRegister(true)
    setError("")
    setSuccess("")

  }


  // ==========================================================
  // SWITCH TO LOGIN
  // ==========================================================

  function openLogin() {

    setIsRegister(false)
    setError("")
    setSuccess("")

  }


  // ==========================================================
  // LOGIN
  // ==========================================================

  function handleLogin(e) {

    e.preventDefault()

    setError("")
    setSuccess("")

    if (!username.trim() || !password) {

      setError(
        "Please enter both username and password"
      )

      return
    }

    setLoading(true)

    apiLogin(
      username.trim(),
      password
    )

      .then((data) => {

        login(data)

        navigate(
          ROLE_TO_PATH[data.role] || "/login"
        )

      })

      .catch((err) => {

        setError(
          err.message || "Login failed"
        )

      })

      .finally(() => {

        setLoading(false)

      })
  }


  // ============================================================
  // REGISTER
  // ============================================================

  async function handleRegister(e) {

    e.preventDefault()

    setError("")
    setSuccess("")

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (
      !userId.trim() ||
      !name.trim() ||
      !registerUsername.trim() ||
      !registerPassword ||
      !confirmPassword ||
      !role
    ) {

      setError("Please fill all fields")

      return
    }


    if (
      registerPassword !==
      confirmPassword
    ) {

      setError("Passwords do not match")

      return
    }


    if (
      registerPassword.length < 6
    ) {

      setError(
        "Password must be at least 6 characters"
      )

      return
    }


    setLoading(true)

    try {

      const registeredUsername =
        registerUsername.trim()


      await apiRegister(
        userId.trim(),
        name.trim(),
        registeredUsername,
        registerPassword,
        role
      )


      setSuccess(
        "Registration successful! Returning to login..."
      )


      // Clear registration fields

      setUserId("")
      setName("")
      setRegisterUsername("")
      setRegisterPassword("")
      setConfirmPassword("")
      setRole("")


      // Put username into Login

      setUsername(
        registeredUsername
      )


      // Return to Login

      setTimeout(() => {

        setIsRegister(false)
        setSuccess("")

      }, 1200)


    } catch (err) {

      setError(
        err.message ||
        "Registration failed"
      )

    } finally {

      setLoading(false)

    }
  }


  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (

    <div className="hospital-auth-page">


      {/* ======================================================
          LEFT SIDE — HOSPITAL IMAGE
          ====================================================== */}

      <div className="hospital-image-side">

        <img
          src={hospitalImage}
          alt="Hospital"
          className="hospital-image"
        />


        <div className="hospital-image-overlay" />


        <div className="hospital-image-content">

          <div className="hospital-logo">
            🏥
          </div>


          <h1>
            Hospital Support
            <br />
            Request System
          </h1>


          <p>
            A centralized platform for managing
            hospital support requests, maintenance,
            equipment, IT and facility services.
          </p>


          <div className="hospital-feature-list">

            <div>
              ✓ Easy request management
            </div>

            <div>
              ✓ Real-time request tracking
            </div>

            <div>
              ✓ Department coordination
            </div>

            <div>
              ✓ Support team collaboration
            </div>

          </div>

        </div>

      </div>


      {/* ======================================================
          RIGHT SIDE — FORM
          ====================================================== */}

      <div className="hospital-form-side">

        <div className="hospital-form-container">


          {/* ==================================================
              LOGIN
              ================================================== */}

          {!isRegister && (

            <div>

              <div className="form-heading">

                <h2>
                  Welcome Back
                </h2>

                <p>
                  Sign in to continue to your dashboard
                </p>

              </div>


              <form onSubmit={handleLogin}>


                {/* USERNAME */}

                <div className="auth-field">

                  <label>
                    Username
                  </label>

                  <div className="input-wrapper">

                    <span className="input-icon">
                      👤
                    </span>

                    <input
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value
                        )
                      }
                      disabled={loading}
                      placeholder="Enter username"
                      autoComplete="username"
                    />

                  </div>

                </div>


                {/* PASSWORD */}

                <div className="auth-field">

                  <label>
                    Password
                  </label>

                  <div className="input-wrapper">

                    <span className="input-icon">
                      🔒
                    </span>

                    <input
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      disabled={loading}
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />

                  </div>

                </div>


                {/* ERROR */}

                {error && (

                  <div className="auth-error">
                    ⚠️ {error}
                  </div>

                )}


                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="button-spinner" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <span className="button-arrow">
                        →
                      </span>
                    </>
                  )}

                </button>

              </form>


              {/* REGISTER LINK */}

              <div className="auth-switch">

                <span>
                  Don't have an account?
                </span>

                <button
                  type="button"
                  onClick={openRegister}
                >
                  Register
                </button>

              </div>

            </div>

          )}


          {/* ==================================================
              REGISTER
              ================================================== */}

          {isRegister && (

            <div>

              <div className="form-heading">

                <h2>
                  Create Account
                </h2>

                <p>
                  Register for the Hospital Support System
                </p>

              </div>


              <form onSubmit={handleRegister}>


                {/* USER ID + NAME */}

                <div className="form-row">


                  <div className="auth-field">

                    <label>
                      User ID
                    </label>

                    <div className="input-wrapper">

                      <span className="input-icon">
                        🆔
                      </span>

                      <input
                        type="text"
                        value={userId}
                        onChange={(e) =>
                          setUserId(
                            e.target.value
                          )
                        }
                        disabled={loading}
                        placeholder="User ID"
                        autoComplete="off"
                      />

                    </div>

                  </div>


                  <div className="auth-field">

                    <label>
                      Full Name
                    </label>

                    <div className="input-wrapper">

                      <span className="input-icon">
                        👤
                      </span>

                      <input
                        type="text"
                        value={name}
                        onChange={(e) =>
                          setName(
                            e.target.value
                          )
                        }
                        disabled={loading}
                        placeholder="Full name"
                        autoComplete="name"
                      />

                    </div>

                  </div>

                </div>


                {/* USERNAME + ROLE */}

                <div className="form-row">


                  <div className="auth-field">

                    <label>
                      Username
                    </label>

                    <div className="input-wrapper">

                      <span className="input-icon">
                        @
                      </span>

                      <input
                        type="text"
                        value={registerUsername}
                        onChange={(e) =>
                          setRegisterUsername(
                            e.target.value
                          )
                        }
                        disabled={loading}
                        placeholder="Username"
                        autoComplete="username"
                      />

                    </div>

                  </div>


                  {/* ROLE */}

                  <div className="auth-field">

                    <label>
                      Role
                    </label>

                    <div className="input-wrapper role-select-wrapper">

                      <select
                        value={role}
                        onChange={(e) =>
                          setRole(
                            e.target.value
                          )
                        }
                        disabled={loading}
                      >

                        <option value="">
                          Select Role
                        </option>

                        {ROLE_OPTIONS.map(
                          (item) => (

                            <option
                              key={item.value}
                              value={item.value}
                            >
                              {item.label}
                            </option>

                          )
                        )}

                      </select>

                    </div>

                  </div>

                </div>


                {/* PASSWORD + CONFIRM PASSWORD */}

                <div className="form-row">


                  <div className="auth-field">

                    <label>
                      Password
                    </label>

                    <div className="input-wrapper">

                      <span className="input-icon">
                        🔒
                      </span>

                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(e) =>
                          setRegisterPassword(
                            e.target.value
                          )
                        }
                        disabled={loading}
                        placeholder="Password"
                        autoComplete="new-password"
                      />

                    </div>

                  </div>


                  <div className="auth-field">

                    <label>
                      Confirm Password
                    </label>

                    <div className="input-wrapper">

                      <span className="input-icon">
                        🔐
                      </span>

                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        disabled={loading}
                        placeholder="Confirm password"
                        autoComplete="new-password"
                      />

                    </div>

                  </div>

                </div>


                {/* ERROR */}

                {error && (

                  <div className="auth-error">
                    ⚠️ {error}
                  </div>

                )}


                {/* SUCCESS */}

                {success && (

                  <div className="auth-success">
                    ✓ {success}
                  </div>

                )}


                {/* REGISTER BUTTON */}

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="button-spinner" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <span className="button-arrow">
                        →
                      </span>
                    </>
                  )}

                </button>

              </form>


              {/* LOGIN LINK */}

              <div className="auth-switch">

                <span>
                  Already have an account?
                </span>

                <button
                  type="button"
                  onClick={openLogin}
                >
                  Login
                </button>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  )
}