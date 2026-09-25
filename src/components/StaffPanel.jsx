import { useEffect, useState } from "react"

import {
  apiDelete,
  apiGet,
  apiPost,
} from "../api"

export default function StaffPanel() {

  // ============================================================
  // USER
  // ============================================================

  const [user, setUser] = useState(null)

  // ============================================================
  // DATA
  // ============================================================

  const [requests, setRequests] = useState([])
  const [departments, setDepartments] = useState([])

  // ============================================================
  // CATEGORIES
  // ============================================================
  // Your staff backend validates these category names.
  // ============================================================

  const categories = [
    "EQUIPMENT_ISSUE",
    "MAINTENANCE",
    "IT_ISSUE",
    "FACILITY_REQUEST",
  ]

  // ============================================================
  // FORM
  // ============================================================

  const [formData, setFormData] = useState({
    request_id: "",
    title: "",
    description: "",
    department: "",
    category: "",
    priority: "MEDIUM",
  })

  // ============================================================
  // UI
  // ============================================================

  const [activeSection, setActiveSection] =
    useState("dashboard")

  const [loading, setLoading] =
    useState(true)

  const [loadingData, setLoadingData] =
    useState(false)

  const [message, setMessage] =
    useState("")

  const [error, setError] =
    useState("")

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadUserAndData()
  }, [])

  // ============================================================
  // LOAD USER + DEPARTMENTS + REQUESTS
  // ============================================================

  async function loadUserAndData() {

    try {

      setLoading(true)
      setError("")

      // --------------------------------------------------------
      // GET LOGGED-IN USER
      // --------------------------------------------------------

      const currentUser =
        await apiGet("/auth/me")

      setUser(currentUser)

      // --------------------------------------------------------
      // IMPORTANT:
      // We DO NOT use currentUser.department.
      //
      // Staff can select ANY department while creating
      // a support request.
      // --------------------------------------------------------

      // --------------------------------------------------------
      // LOAD DEPARTMENTS
      // --------------------------------------------------------

      const departmentData =
        await apiGet("/staff/departments")

      let departmentList = []

      if (Array.isArray(departmentData)) {

        departmentList =
          departmentData

      } else if (
        Array.isArray(
          departmentData.departments
        )
      ) {

        departmentList =
          departmentData.departments

      }

      // Convert department objects to names
      departmentList =
        departmentList
          .map((department) => {

            if (
              typeof department ===
              "string"
            ) {
              return department
            }

            return department?.name

          })
          .filter(Boolean)

      setDepartments(
        departmentList
      )

      // --------------------------------------------------------
      // LOAD REQUESTS
      // --------------------------------------------------------

      await loadRequests(
        departmentList
      )

      // --------------------------------------------------------
      // Do NOT assign a department from user account.
      // Staff chooses it for every request.
      // --------------------------------------------------------

      setFormData((previous) => ({
        ...previous,
        department: "",
      }))

    } catch (err) {

      console.error(
        "Staff dashboard load error:",
        err
      )

      setError(
        err.message ||
        "Unable to load Staff dashboard."
      )

    } finally {

      setLoading(false)

    }
  }

  // ============================================================
  // LOAD REQUESTS
  // ============================================================
  //
  // There is no fixed department for the staff account.
  //
  // Therefore we load requests for all available departments.
  //
  // This allows:
  //
  // OPD
  // Cardiology
  // Emergency
  // ICU
  // Radiology
  // etc.
  //
  // to appear without assigning one department to the user.
  // ============================================================

  async function loadRequests(
    departmentList = departments
  ) {

    try {

      setLoadingData(true)
      setError("")

      if (
        !departmentList ||
        departmentList.length === 0
      ) {

        setRequests([])

        return
      }

      const responses =
        await Promise.all(
          departmentList.map(
            async (department) => {

              try {

                return await apiGet(
                  `/staff/requests/department/${encodeURIComponent(
                    department
                  )}`
                )

              } catch (err) {

                console.warn(
                  `Could not load requests for ${department}:`,
                  err
                )

                return {
                  requests: [],
                }

              }

            }
          )
        )

      // --------------------------------------------------------
      // COMBINE REQUESTS FROM ALL DEPARTMENTS
      // --------------------------------------------------------

      const combinedRequests = []

      responses.forEach(
        (response) => {

          if (
            Array.isArray(
              response?.requests
            )
          ) {

            combinedRequests.push(
              ...response.requests
            )

          }

        }
      )

      // --------------------------------------------------------
      // REMOVE DUPLICATES
      // --------------------------------------------------------

      const uniqueRequests = []

      const seenIds = new Set()

      combinedRequests.forEach(
        (request) => {

          const id =
            request?.request_id ||
            request?.id ||
            request?._id

          if (!id) {
            return
          }

          if (
            seenIds.has(id)
          ) {
            return
          }

          seenIds.add(id)

          uniqueRequests.push(
            request
          )

        }
      )

      // --------------------------------------------------------
      // NEWEST FIRST
      // --------------------------------------------------------

      uniqueRequests.sort(
        (a, b) => {

          const dateA =
            new Date(
              a?.created_at || 0
            ).getTime()

          const dateB =
            new Date(
              b?.created_at || 0
            ).getTime()

          return dateB - dateA
        }
      )

      setRequests(
        uniqueRequests
      )

    } catch (err) {

      console.error(
        "Request loading error:",
        err
      )

      setError(
        err.message ||
        "Unable to load requests."
      )

    } finally {

      setLoadingData(false)

    }
  }

  // ============================================================
  // REFRESH
  // ============================================================

  async function refreshData() {

    try {

      setMessage("")
      setError("")

      setLoadingData(true)

      // Reload departments first
      const departmentData =
        await apiGet("/staff/departments")

      let departmentList = []

      if (Array.isArray(departmentData)) {

        departmentList =
          departmentData

      } else if (
        Array.isArray(
          departmentData.departments
        )
      ) {

        departmentList =
          departmentData.departments

      }

      departmentList =
        departmentList
          .map((department) => {

            if (
              typeof department ===
              "string"
            ) {
              return department
            }

            return department?.name

          })
          .filter(Boolean)

      setDepartments(
        departmentList
      )

      await loadRequests(
        departmentList
      )

    } catch (err) {

      setError(
        err.message ||
        "Refresh failed."
      )

    } finally {

      setLoadingData(false)

    }
  }

  // ============================================================
  // HANDLE FORM CHANGE
  // ============================================================

  function handleChange(e) {

    const {
      name,
      value,
    } = e.target

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    )

  }

  // ============================================================
  // CREATE REQUEST
  // ============================================================

  async function createRequest(e) {

    e.preventDefault()

    setMessage("")
    setError("")

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (
      !formData.request_id.trim()
    ) {

      setError(
        "Please enter a Request ID."
      )

      return
    }

    if (
      !formData.title.trim()
    ) {

      setError(
        "Please enter a request title."
      )

      return
    }

    if (
      !formData.description.trim()
    ) {

      setError(
        "Please enter a description."
      )

      return
    }

    if (
      !formData.department
    ) {

      setError(
        "Please select a department."
      )

      return
    }

    if (
      !formData.category
    ) {

      setError(
        "Please select a category."
      )

      return
    }

    // ----------------------------------------------------------
    // CREATE REQUEST
    // ----------------------------------------------------------

    try {

      setLoadingData(true)

      const data =
        await apiPost(
          "/staff/requests",
          {
            request_id:
              formData.request_id.trim(),

            title:
              formData.title.trim(),

            description:
              formData.description.trim(),

            category:
              formData.category,

            department:
              formData.department,

            priority:
              formData.priority,
          }
        )

      // --------------------------------------------------------
      // SUCCESS MESSAGE
      // --------------------------------------------------------

      setMessage(
        data?.message ||
        "Support request created successfully."
      )

      // --------------------------------------------------------
      // CLEAR FORM
      // --------------------------------------------------------

      setFormData({
        request_id: "",
        title: "",
        description: "",
        department: "",
        category: "",
        priority: "MEDIUM",
      })

      // --------------------------------------------------------
      // RELOAD ALL REQUESTS
      // --------------------------------------------------------

      await refreshData()

      // --------------------------------------------------------
      // SHOW MY REQUESTS
      // --------------------------------------------------------

      setActiveSection(
        "requests"
      )

    } catch (err) {

      console.error(
        "Create request error:",
        err
      )

      setError(
        err.message ||
        "Failed to create support request."
      )

    } finally {

      setLoadingData(false)

    }
  }

  // ============================================================
  // CANCEL REQUEST
  // ============================================================

  async function cancelRequest(
    request
  ) {

    const requestId =
      request?.request_id

    if (!requestId) {
      return
    }

    const confirmed =
      window.confirm(
        `Cancel request ${requestId}?`
      )

    if (!confirmed) {
      return
    }

    setMessage("")
    setError("")

    try {

      setLoadingData(true)

      const data =
        await apiDelete(
          `/staff/requests/${encodeURIComponent(
            requestId
          )}`
        )

      setMessage(
        data?.message ||
        "Request cancelled successfully."
      )

      await refreshData()

    } catch (err) {

      setError(
        err.message ||
        "Unable to cancel request."
      )

    } finally {

      setLoadingData(false)

    }
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalRequests =
    requests.length

  const newRequests =
    requests.filter(
      (request) =>
        request?.status === "NEW"
    ).length

  const assignedRequests =
    requests.filter(
      (request) =>
        request?.status ===
        "ASSIGNED"
    ).length

  const inProgressRequests =
    requests.filter(
      (request) =>
        request?.status ===
        "IN_PROGRESS"
    ).length

  const resolvedRequests =
    requests.filter(
      (request) =>
        request?.status ===
        "RESOLVED"
    ).length

  const closedRequests =
    requests.filter(
      (request) =>
        request?.status ===
        "CLOSED"
    ).length

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="text-center py-5">

        <div
          className="spinner-border text-primary"
          role="status"
        />

        <div className="mt-3 text-muted">
          Loading Department dashboard...
        </div>

      </div>

    )
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (

    <div>

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div
        className="rounded-4 p-4 mb-4"
        style={{
          background:
            "linear-gradient(135deg, #0d6efd, #4f8df7)",
          color: "white",
        }}
      >

        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">

          <div>

            <div
              className="text-uppercase small fw-semibold"
              style={{
                opacity: 0.85,
              }}
            >
              Department Workspace
            </div>

            <h2 className="fw-bold mb-1">
              Department
            </h2>

            <div
              style={{
                opacity: 0.9,
              }}
            >
              Welcome,{" "}
              {user?.name ||
                user?.username ||
                "Staff"}
            </div>

          </div>

          <button
            className="btn btn-light"
            onClick={refreshData}
            disabled={loadingData}
          >

            {loadingData
              ? "Refreshing..."
              : "↻ Refresh"}

          </button>

        </div>

      </div>


      {/* ======================================================
          MESSAGES
          ====================================================== */}

      {message && (

        <div
          className="alert alert-success d-flex justify-content-between align-items-center"
          role="alert"
        >

          <span>
            ✓ {message}
          </span>

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setMessage("")
            }
          />

        </div>

      )}


      {error && (

        <div
          className="alert alert-danger d-flex justify-content-between align-items-center"
          role="alert"
        >

          <span>
            ⚠ {error}
          </span>

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setError("")
            }
          />

        </div>

      )}


      {/* ======================================================
          NAVIGATION
          ====================================================== */}

      <div className="d-flex flex-wrap gap-2 mb-4">

        <button
          type="button"
          className={`btn ${
            activeSection ===
            "dashboard"
              ? "btn-primary"
              : "btn-outline-primary"
          }`}
          onClick={() =>
            setActiveSection(
              "dashboard"
            )
          }
        >
          Dashboard
        </button>


        <button
          type="button"
          className={`btn ${
            activeSection ===
            "new-request"
              ? "btn-primary"
              : "btn-outline-primary"
          }`}
          onClick={() =>
            setActiveSection(
              "new-request"
            )
          }
        >
          + New Request
        </button>


        <button
          type="button"
          className={`btn ${
            activeSection ===
            "requests"
              ? "btn-primary"
              : "btn-outline-primary"
          }`}
          onClick={() =>
            setActiveSection(
              "requests"
            )
          }
        >
          My Requests
        </button>

      </div>


      {/* ======================================================
          DASHBOARD
          ====================================================== */}

      {activeSection ===
        "dashboard" && (

        <div>

          {/* Statistics */}

          <div className="row g-3 mb-4">

            <StaffStat
              title="Total Requests"
              value={totalRequests}
              icon="📋"
              type="primary"
            />

            <StaffStat
              title="New"
              value={newRequests}
              icon="🆕"
              type="info"
            />

            <StaffStat
              title="Assigned"
              value={assignedRequests}
              icon="👤"
              type="warning"
            />

            <StaffStat
              title="In Progress"
              value={inProgressRequests}
              icon="⚙️"
              type="warning"
            />

            <StaffStat
              title="Resolved"
              value={resolvedRequests}
              icon="✓"
              type="success"
            />

            <StaffStat
              title="Closed"
              value={closedRequests}
              icon="🔒"
              type="dark"
            />

          </div>


          {/* Department Actions */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

              <h4 className="fw-bold mb-3">
                Department Actions
              </h4>

              <div className="row g-3">

                <div className="col-md-4">

                  <button
                    type="button"
                    className="btn btn-primary w-100 py-3"
                    onClick={() =>
                      setActiveSection(
                        "new-request"
                      )
                    }
                  >

                    <div className="fs-4">
                      ➕
                    </div>

                    New Support Request

                  </button>

                </div>


                <div className="col-md-4">

                  <button
                    type="button"
                    className="btn btn-outline-primary w-100 py-3"
                    onClick={() =>
                      setActiveSection(
                        "requests"
                      )
                    }
                  >

                    <div className="fs-4">
                      📋
                    </div>

                    My Requests

                  </button>

                </div>


                <div className="col-md-4">

                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 py-3"
                    onClick={refreshData}
                    disabled={loadingData}
                  >

                    <div className="fs-4">
                      ↻
                    </div>

                    Refresh Data

                  </button>

                </div>

              </div>

            </div>

          </div>


          {/* Recent Requests */}

          <div className="card border-0 shadow-sm">

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-center mb-3">

                <div>

                  <h4 className="fw-bold mb-1">
                    Recent Requests
                  </h4>

                  <p className="text-muted mb-0">
                    Latest support requests
                  </p>

                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() =>
                    setActiveSection(
                      "requests"
                    )
                  }
                >
                  View All
                </button>

              </div>


              {requests.length === 0 ? (

                <EmptyState
                  title="No requests yet"
                  text="Create your first support request."
                />

              ) : (

                <div className="table-responsive">

                  <table className="table align-middle">

                    <thead>

                      <tr>

                        <th>
                          Request
                        </th>

                        <th>
                          Title
                        </th>

                        <th>
                          Department
                        </th>

                        <th>
                          Status
                        </th>

                        <th />

                      </tr>

                    </thead>

                    <tbody>

                      {requests
                        .slice(0, 5)
                        .map(
                          (request) => (

                            <StaffRequestRow
                              key={
                                request.request_id
                              }
                              request={
                                request
                              }
                              onCancel={
                                cancelRequest
                              }
                            />

                          )
                        )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          NEW REQUEST
          ====================================================== */}

      {activeSection ===
        "new-request" && (

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <h3 className="fw-bold mb-1">
              Create Support Request
            </h3>

            <p className="text-muted mb-4">
              Report an equipment, maintenance,
              IT, or facility issue to the support team.
            </p>


            <form
              onSubmit={
                createRequest
              }
            >

              {/* =================================================
                  REQUEST ID + DEPARTMENT
                  ================================================= */}

              <div className="row g-3 mb-3">

                <div className="col-md-6">

                  <label className="form-label fw-semibold">
                    Request ID
                  </label>

                  <input
                    type="text"
                    name="request_id"
                    className="form-control form-control-lg"
                    placeholder="Example: REQ102"
                    value={
                      formData.request_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>


                <div className="col-md-6">

                  <label className="form-label fw-semibold">
                    Department
                  </label>

                  <select
                    name="department"
                    className="form-select form-select-lg"
                    value={
                      formData.department
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Department
                    </option>

                    {departments.map(
                      (
                        department
                      ) => (

                        <option
                          key={
                            department
                          }
                          value={
                            department
                          }
                        >
                          {
                            department
                          }
                        </option>

                      )
                    )}

                  </select>

                  <div className="form-text">
                    Select any department where
                    the issue occurred.
                  </div>

                </div>

              </div>


              {/* =================================================
                  REQUEST TITLE
                  ================================================= */}

              <div className="mb-3">

                <label className="form-label fw-semibold">
                  Request Title
                </label>

                <input
                  type="text"
                  name="title"
                  className="form-control form-control-lg"
                  placeholder="Example: Ventilator is not working"
                  value={
                    formData.title
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>


              {/* =================================================
                  DESCRIPTION
                  ================================================= */}

              <div className="mb-3">

                <label className="form-label fw-semibold">
                  Description
                </label>

                <textarea
                  name="description"
                  className="form-control"
                  rows="5"
                  placeholder="Describe the problem in detail..."
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>


              {/* =================================================
                  CATEGORY + PRIORITY
                  ================================================= */}

              <div className="row g-3 mb-4">

                <div className="col-md-6">

                  <label className="form-label fw-semibold">
                    Category
                  </label>

                  <select
                    name="category"
                    className="form-select form-select-lg"
                    value={
                      formData.category
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Category
                    </option>

                    {categories.map(
                      (
                        category
                      ) => (

                        <option
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {formatLabel(
                            category
                          )}
                        </option>

                      )
                    )}

                  </select>

                  <div className="form-text">
                    Select the type of support required.
                  </div>

                </div>


                <div className="col-md-6">

                  <label className="form-label fw-semibold">
                    Priority
                  </label>

                  <select
                    name="priority"
                    className="form-select form-select-lg"
                    value={
                      formData.priority
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="CRITICAL">
                      Critical
                    </option>

                  </select>

                </div>

              </div>


              {/* =================================================
                  BUTTONS
                  ================================================= */}

              <div className="d-flex gap-2 flex-wrap">

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={
                    loadingData
                  }
                >

                  {loadingData
                    ? "Creating..."
                    : "Create Support Request"}

                </button>


                <button
                  type="button"
                  className="btn btn-outline-secondary btn-lg"
                  onClick={() => {

                    setFormData({
                      request_id: "",
                      title: "",
                      description: "",
                      department: "",
                      category: "",
                      priority: "MEDIUM",
                    })

                    setMessage("")
                    setError("")

                  }}
                >
                  Clear
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ======================================================
          MY REQUESTS
          ====================================================== */}

      {activeSection ===
        "requests" && (

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

              <div>

                <h3 className="fw-bold mb-1">
                  My Requests
                </h3>

                <p className="text-muted mb-0">
                  Support requests
                </p>

              </div>

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={
                  refreshData
                }
                disabled={loadingData}
              >
                ↻ Refresh
              </button>

            </div>


            {requests.length === 0 ? (

              <EmptyState
                title="No requests"
                text="No support requests are available yet."
              />

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead className="table-light">

                    <tr>

                      <th>
                        Request ID
                      </th>

                      <th>
                        Title
                      </th>

                      <th>
                        Department
                      </th>

                      <th>
                        Category
                      </th>

                      <th>
                        Priority
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Assigned To
                      </th>

                      <th>
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {requests.map(
                      (
                        request
                      ) => (

                        <tr
                          key={
                            request.request_id
                          }
                        >

                          <td>

                            <strong>
                              {
                                request.request_id
                              }
                            </strong>

                          </td>


                          <td>

                            <div className="fw-semibold">
                              {
                                request.title ||
                                "-"
                              }
                            </div>

                            <small className="text-muted">
                              {truncate(
                                request.description,
                                45
                              )}
                            </small>

                          </td>


                          <td>
                            {
                              request.department ||
                              "-"
                            }
                          </td>


                          <td>
                            {formatLabel(
                              request.category
                            )}
                          </td>


                          <td>

                            <PriorityBadge
                              value={
                                request.priority
                              }
                            />

                          </td>


                          <td>

                            <StatusBadge
                              value={
                                request.status
                              }
                            />

                          </td>


                          <td>
                            {
                              request.assigned_to ||
                              "Not assigned"
                            }
                          </td>


                          <td>

                            {request.status ===
                              "NEW" && (

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                  cancelRequest(
                                    request
                                  )
                                }
                              >
                                Cancel
                              </button>

                            )}

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  )
}


// ============================================================
// STAT CARD
// ============================================================

function StaffStat({
  title,
  value,
  icon,
  type,
}) {

  const borderClasses = {

    primary:
      "border-primary",

    info:
      "border-info",

    warning:
      "border-warning",

    success:
      "border-success",

    dark:
      "border-dark",

  }

  return (

    <div className="col-6 col-md-4 col-xl">

      <div
        className={`card h-100 shadow-sm border-start border-4 ${
          borderClasses[type] ||
          "border-primary"
        }`}
      >

        <div className="card-body">

          <div className="d-flex justify-content-between">

            <div>

              <div className="text-muted small">
                {title}
              </div>

              <div className="fs-2 fw-bold">
                {value}
              </div>

            </div>

            <div className="fs-4">
              {icon}
            </div>

          </div>

        </div>

      </div>

    </div>

  )
}


// ============================================================
// REQUEST ROW
// ============================================================

function StaffRequestRow({
  request,
  onCancel,
}) {

  return (

    <tr>

      <td>

        <strong>
          {request.request_id}
        </strong>

      </td>


      <td>

        <div className="fw-semibold">
          {request.title || "-"}
        </div>

        <small className="text-muted">
          {truncate(
            request.description,
            45
          )}
        </small>

      </td>


      <td>
        {
          request.department ||
          "-"
        }
      </td>


      <td>

        <StatusBadge
          value={
            request.status
          }
        />

      </td>


      <td>

        {request.status ===
          "NEW" && (

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() =>
              onCancel(request)
            }
          >
            Cancel
          </button>

        )}

      </td>

    </tr>

  )
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  value,
}) {

  const classes = {

    NEW:
      "bg-info-subtle text-info-emphasis",

    ASSIGNED:
      "bg-warning-subtle text-warning-emphasis",

    IN_PROGRESS:
      "bg-primary-subtle text-primary-emphasis",

    ON_HOLD:
      "bg-secondary-subtle text-secondary-emphasis",

    RESOLVED:
      "bg-success-subtle text-success-emphasis",

    CONFIRMED:
      "bg-success-subtle text-success-emphasis",

    CLOSED:
      "bg-dark-subtle text-dark-emphasis",

    CANCELLED:
      "bg-danger-subtle text-danger-emphasis",

  }

  return (

    <span
      className={`badge rounded-pill px-3 py-2 ${
        classes[value] ||
        "bg-secondary-subtle text-secondary-emphasis"
      }`}
    >
      {formatLabel(value)}
    </span>

  )
}


// ============================================================
// PRIORITY BADGE
// ============================================================

function PriorityBadge({
  value,
}) {

  const classes = {

    LOW:
      "bg-success-subtle text-success-emphasis",

    MEDIUM:
      "bg-info-subtle text-info-emphasis",

    HIGH:
      "bg-warning-subtle text-warning-emphasis",

    CRITICAL:
      "bg-danger-subtle text-danger-emphasis",

  }

  return (

    <span
      className={`badge rounded-pill px-3 py-2 ${
        classes[value] ||
        "bg-secondary-subtle text-secondary-emphasis"
      }`}
    >
      {formatLabel(value)}
    </span>

  )
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  title,
  text,
}) {

  return (

    <div className="text-center py-5">

      <div className="display-5 mb-3">
        📋
      </div>

      <h5 className="fw-bold">
        {title}
      </h5>

      <p className="text-muted mb-0">
        {text}
      </p>

    </div>

  )
}


// ============================================================
// FORMAT LABEL
// ============================================================

function formatLabel(value) {

  if (!value) {
    return ""
  }

  return value
    .toString()
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ")
}


// ============================================================
// TRUNCATE
// ============================================================

function truncate(
  value,
  length
) {

  if (!value) {
    return ""
  }

  if (
    value.length <=
    length
  ) {
    return value
  }

  return (
    value.substring(
      0,
      length
    ) + "..."
  )
}