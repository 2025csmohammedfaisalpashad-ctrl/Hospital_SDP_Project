import { useEffect, useMemo, useState } from "react"
import {
  apiDelete,
  apiGet,
  apiPut,
} from "../api"

export default function TeamLeadPanel() {

  // ============================================================
  // USER
  // ============================================================

  const [user, setUser] = useState(null)

  // ============================================================
  // DATA
  // ============================================================

  const [requests, setRequests] = useState([])
  const [engineers, setEngineers] = useState([])
  const [summary, setSummary] = useState({})
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [engineerRequests, setEngineerRequests] = useState([])

  // ============================================================
  // FILTERS
  // ============================================================

  const [statusFilter, setStatusFilter] = useState("ALL")
  const [departmentFilter, setDepartmentFilter] = useState("ALL")
  const [searchText, setSearchText] = useState("")

  // ============================================================
  // ASSIGNMENT
  // ============================================================

  const [selectedEngineer, setSelectedEngineer] = useState("")

  // ============================================================
  // UI
  // ============================================================

  const [activeSection, setActiveSection] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // ============================================================
  // CONSTANTS
  // ============================================================

  const statuses = [
    "NEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "RESOLVED",
    "CONFIRMED",
    "CLOSED",
    "CANCELLED",
  ]

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadUserAndData()
  }, [])

  async function loadUserAndData() {

    try {

      setLoading(true)
      setError("")

      const currentUser = await apiGet("/auth/me")

      setUser(currentUser)

      await loadAllData()

    } catch (err) {

      setError(err.message)

    } finally {

      setLoading(false)

    }
  }

  // ============================================================
  // LOAD ALL DATA
  // ============================================================

  async function loadAllData() {

    try {

      setLoadingData(true)

      const [
        requestData,
        engineerData,
        summaryData,
      ] = await Promise.all([

        apiGet("/teamlead/requests"),

        apiGet("/teamlead/engineers"),

        apiGet("/teamlead/summary"),

      ])

      setRequests(
        requestData.requests || []
      )

      setEngineers(
        engineerData.engineers || []
      )

      setSummary(
        summaryData || {}
      )

    } catch (err) {

      setError(err.message)

    } finally {

      setLoadingData(false)

    }
  }

  // ============================================================
  // REFRESH
  // ============================================================

  async function refreshData() {

    setMessage("")
    setError("")

    await loadAllData()

  }

  // ============================================================
  // OPEN REQUEST
  // ============================================================

  async function openRequest(request) {

    setMessage("")
    setError("")

    try {

      const data = await apiGet(
        `/teamlead/requests/${encodeURIComponent(
          request.request_id
        )}`
      )

      setSelectedRequest(data)

      setSelectedEngineer(
        data.assigned_to || ""
      )

      setActiveSection("details")

    } catch (err) {

      setError(err.message)

    }
  }

  // ============================================================
  // ASSIGN REQUEST
  // ============================================================

  async function assignRequest() {

    if (!selectedRequest) return

    if (!selectedEngineer) {

      setError(
        "Please select a support engineer."
      )

      return
    }

    setMessage("")
    setError("")

    try {

      const data = await apiPut(
        `/teamlead/requests/${encodeURIComponent(
          selectedRequest.request_id
        )}/assign`,
        {
          engineer_id: selectedEngineer,
        }
      )

      setMessage(
        data.message ||
          "Request assigned successfully"
      )

      const updated = await apiGet(
        `/teamlead/requests/${encodeURIComponent(
          selectedRequest.request_id
        )}`
      )

      setSelectedRequest(updated)

      setSelectedEngineer(
        updated.assigned_to || ""
      )

      await loadAllData()

    } catch (err) {

      setError(err.message)

    }
  }

  // ============================================================
  // REASSIGN REQUEST
  // ============================================================

  async function reassignRequest() {

    if (!selectedRequest) return

    if (!selectedEngineer) {

      setError(
        "Please select a support engineer."
      )

      return
    }

    setMessage("")
    setError("")

    try {

      const data = await apiPut(
        `/teamlead/requests/${encodeURIComponent(
          selectedRequest.request_id
        )}/reassign`,
        {
          engineer_id: selectedEngineer,
        }
      )

      setMessage(
        data.message ||
          "Request reassigned successfully"
      )

      const updated = await apiGet(
        `/teamlead/requests/${encodeURIComponent(
          selectedRequest.request_id
        )}`
      )

      setSelectedRequest(updated)

      setSelectedEngineer(
        updated.assigned_to || ""
      )

      await loadAllData()

    } catch (err) {

      setError(err.message)

    }
  }

  // ============================================================
  // CLOSE REQUEST
  // ============================================================

  async function closeRequest() {

    if (!selectedRequest) return

    if (selectedRequest.status !== "RESOLVED") {

      setError(
        "Only a resolved request can be closed."
      )

      return
    }

    const confirmed = window.confirm(
      `Close request ${selectedRequest.request_id}?`
    )

    if (!confirmed) return

    setMessage("")
    setError("")

    try {

      const data = await apiPut(
        `/teamlead/requests/${encodeURIComponent(
          selectedRequest.request_id
        )}/status`,
        {
          status: "CLOSED",
        }
      )

      setMessage(
        data.message ||
          "Request closed successfully"
      )

      const updated = await apiGet(
        `/teamlead/requests/${encodeURIComponent(
          selectedRequest.request_id
        )}`
      )

      setSelectedRequest(updated)

      await loadAllData()

    } catch (err) {

      setError(err.message)

    }
  }

  // ============================================================
  // CANCEL REQUEST
  // ============================================================

  async function cancelRequest(request) {

    const confirmed = window.confirm(
      `Cancel request ${request.request_id}?`
    )

    if (!confirmed) return

    setMessage("")
    setError("")

    try {

      const data = await apiDelete(
        `/teamlead/requests/${encodeURIComponent(
          request.request_id
        )}`
      )

      setMessage(
        data.message ||
          "Request cancelled successfully"
      )

      if (
        selectedRequest?.request_id ===
        request.request_id
      ) {

        const updated = await apiGet(
          `/teamlead/requests/${encodeURIComponent(
            request.request_id
          )}`
        )

        setSelectedRequest(updated)

      }

      await loadAllData()

    } catch (err) {

      setError(err.message)

    }
  }

  // ============================================================
  // VIEW ENGINEER WORKLOAD
  // ============================================================

  async function viewEngineerWorkload(
    engineer
  ) {

    setMessage("")
    setError("")

    try {

      const data = await apiGet(
        `/teamlead/engineers/${encodeURIComponent(
          engineer.user_id
        )}/requests`
      )

      setEngineerRequests(
        data.requests || []
      )

      setActiveSection(
        "engineer-workload"
      )

    } catch (err) {

      setError(err.message)

    }
  }

  // ============================================================
  // FILTER REQUESTS
  // ============================================================

  const filteredRequests = useMemo(() => {

    return requests.filter(
      (request) => {

        const statusMatch =
          statusFilter === "ALL" ||
          request.status === statusFilter

        const departmentMatch =
          departmentFilter === "ALL" ||
          request.department ===
            departmentFilter

        const searchMatch =
          !searchText.trim() ||
          request.request_id
            ?.toLowerCase()
            .includes(
              searchText
                .toLowerCase()
                .trim()
            ) ||
          request.title
            ?.toLowerCase()
            .includes(
              searchText
                .toLowerCase()
                .trim()
            )

        return (
          statusMatch &&
          departmentMatch &&
          searchMatch
        )
      }
    )

  }, [
    requests,
    statusFilter,
    departmentFilter,
    searchText,
  ])

  // ============================================================
  // DEPARTMENT LIST
  // ============================================================

  const departments = useMemo(() => {

    return [
      ...new Set(
        requests
          .map(
            (request) =>
              request.department
          )
          .filter(Boolean)
      ),
    ].sort()

  }, [requests])

  // ============================================================
  // SUMMARY
  // ============================================================

  const totalRequests =
    requests.length

  const newRequests =
    summary.NEW || 0

  const assignedRequests =
    summary.ASSIGNED || 0

  const inProgressRequests =
    summary.IN_PROGRESS || 0

  const onHoldRequests =
    summary.ON_HOLD || 0

  const resolvedRequests =
    summary.RESOLVED || 0

  const closedRequests =
    summary.CLOSED || 0

  const cancelledRequests =
    summary.CANCELLED || 0

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="text-center py-5">

        <div
          className="spinner-border text-warning"
          role="status"
        />

        <div className="mt-3 text-muted">
          Loading Team Lead dashboard...
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
            "linear-gradient(135deg, #6f42c1, #8e5ee8)",
          color: "white",
        }}
      >

        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">

          <div>

            <div
              className="text-uppercase small fw-semibold"
              style={{ opacity: 0.8 }}
            >
              Operations Workspace
            </div>

            <h2 className="fw-bold mb-1">
              Team Lead Dashboard
            </h2>

            <div style={{ opacity: 0.9 }}>
              Welcome,{" "}
              {user?.name ||
                user?.username}
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
          All Requests
        </button>


        <button
          className={`btn ${
            activeSection ===
            "engineers"
              ? "btn-primary"
              : "btn-outline-primary"
          }`}
          onClick={() =>
            setActiveSection(
              "engineers"
            )
          }
        >
          Support Engineers
        </button>


        {selectedRequest && (

          <button
            className={`btn ${
              activeSection ===
              "details"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() =>
              setActiveSection(
                "details"
              )
            }
          >
            Request Details
          </button>

        )}

      </div>


      {/* ======================================================
          DASHBOARD
      ====================================================== */}

      {activeSection ===
        "dashboard" && (

        <div>

          {/* Statistics */}

          <div className="row g-3 mb-4">

            <TeamLeadStat
              title="Total"
              value={
                totalRequests
              }
              icon="📋"
              type="primary"
            />

            <TeamLeadStat
              title="New"
              value={
                newRequests
              }
              icon="🆕"
              type="info"
            />

            <TeamLeadStat
              title="Assigned"
              value={
                assignedRequests
              }
              icon="👤"
              type="warning"
            />

            <TeamLeadStat
              title="In Progress"
              value={
                inProgressRequests
              }
              icon="⚙️"
              type="primary"
            />

            <TeamLeadStat
              title="Resolved"
              value={
                resolvedRequests
              }
              icon="✓"
              type="success"
            />

            <TeamLeadStat
              title="Closed"
              value={
                closedRequests
              }
              icon="🔒"
              type="dark"
            />

          </div>


          {/* Operational summary */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

              <h4 className="fw-bold mb-3">
                Request Overview
              </h4>

              <div className="row g-3">

                <OverviewItem
                  label="New"
                  value={
                    newRequests
                  }
                  color="info"
                />

                <OverviewItem
                  label="Assigned"
                  value={
                    assignedRequests
                  }
                  color="warning"
                />

                <OverviewItem
                  label="In Progress"
                  value={
                    inProgressRequests
                  }
                  color="primary"
                />

                <OverviewItem
                  label="On Hold"
                  value={
                    onHoldRequests
                  }
                  color="secondary"
                />

                <OverviewItem
                  label="Resolved"
                  value={
                    resolvedRequests
                  }
                  color="success"
                />

                <OverviewItem
                  label="Cancelled"
                  value={
                    cancelledRequests
                  }
                  color="danger"
                />

              </div>

            </div>

          </div>


          {/* Quick actions */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

              <h4 className="fw-bold mb-3">
                Team Lead Actions
              </h4>

              <div className="row g-3">

                <div className="col-md-4">

                  <button
                    className="btn btn-primary w-100 py-3"
                    onClick={() =>
                      setActiveSection(
                        "requests"
                      )
                    }
                  >

                    <div className="fs-4">
                      📋
                    </div>

                    Manage Requests

                  </button>

                </div>


                <div className="col-md-4">

                  <button
                    className="btn btn-outline-primary w-100 py-3"
                    onClick={() =>
                      setActiveSection(
                        "engineers"
                      )
                    }
                  >

                    <div className="fs-4">
                      👨‍🔧
                    </div>

                    View Engineers

                  </button>

                </div>


                <div className="col-md-4">

                  <button
                    className="btn btn-outline-secondary w-100 py-3"
                    onClick={
                      refreshData
                    }
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


          {/* Recent requests */}

          <div className="card border-0 shadow-sm">

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-center mb-3">

                <div>

                  <h4 className="fw-bold mb-1">
                    Recent Requests
                  </h4>

                  <p className="text-muted mb-0">
                    Latest requests across the hospital
                  </p>

                </div>

                <button
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


              {requests.length ===
              0 ? (

                <EmptyState
                  title="No requests"
                  text="There are currently no support requests."
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
                          Department
                        </th>

                        <th>
                          Priority
                        </th>

                        <th>
                          Status
                        </th>

                        <th />

                      </tr>

                    </thead>

                    <tbody>

                      {requests
                        .slice(
                          0,
                          5
                        )
                        .map(
                          (
                            request
                          ) => (

                            <RequestRow
                              key={
                                request.request_id
                              }
                              request={
                                request
                              }
                              onOpen={
                                openRequest
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
          ALL REQUESTS
      ====================================================== */}

      {activeSection ===
        "requests" && (

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

              <div>

                <h3 className="fw-bold mb-1">
                  Request Management
                </h3>

                <p className="text-muted mb-0">
                  View, assign, reassign and
                  cancel support requests
                </p>

              </div>

              <button
                className="btn btn-outline-primary"
                onClick={
                  refreshData
                }
              >
                ↻ Refresh
              </button>

            </div>


            {/* Filters */}

            <div className="row g-3 mb-4">

              <div className="col-lg-4">

                <label className="form-label fw-semibold">
                  Search
                </label>

                <input
                  className="form-control"
                  placeholder="Request ID or title..."
                  value={
                    searchText
                  }
                  onChange={(e) =>
                    setSearchText(
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="col-lg-4">

                <label className="form-label fw-semibold">
                  Status
                </label>

                <select
                  className="form-select"
                  value={
                    statusFilter
                  }
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="ALL">
                    All Statuses
                  </option>

                  {statuses.map(
                    (status) => (

                      <option
                        key={
                          status
                        }
                        value={
                          status
                        }
                      >
                        {formatLabel(
                          status
                        )}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="col-lg-4">

                <label className="form-label fw-semibold">
                  Department
                </label>

                <select
                  className="form-select"
                  value={
                    departmentFilter
                  }
                  onChange={(e) =>
                    setDepartmentFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="ALL">
                    All Departments
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

              </div>

            </div>


            <div className="d-flex justify-content-between align-items-center mb-3">

              <span className="text-muted">
                {filteredRequests.length} request(s)
              </span>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setStatusFilter(
                    "ALL"
                  )
                  setDepartmentFilter(
                    "ALL"
                  )
                  setSearchText(
                    ""
                  )
                }}
              >
                Clear Filters
              </button>

            </div>


            {filteredRequests.length ===
            0 ? (

              <EmptyState
                title="No matching requests"
                text="Try changing your filters."
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
                        Assigned To
                      </th>

                      <th>
                        Priority
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredRequests.map(
                      (
                        request
                      ) => (

                        <RequestRow
                          key={
                            request.request_id
                          }
                          request={
                            request
                          }
                          onOpen={
                            openRequest
                          }
                          onCancel={
                            cancelRequest
                          }
                          detailed
                        />

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      )}


      {/* ======================================================
          ENGINEERS
      ====================================================== */}

      {activeSection ===
        "engineers" && (

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div>

                <h3 className="fw-bold mb-1">
                  Support Engineers
                </h3>

                <p className="text-muted mb-0">
                  View engineers and their assigned workload
                </p>

              </div>

              <span className="badge bg-primary rounded-pill px-3 py-2">
                {engineers.length} Engineers
              </span>

            </div>


            {engineers.length ===
            0 ? (

              <EmptyState
                title="No engineers found"
                text="There are currently no support engineers."
              />

            ) : (

              <div className="row g-4">

                {engineers.map(
                  (engineer) => {

                    const workload =
                      requests.filter(
                        (
                          request
                        ) =>
                          request.assigned_to ===
                          engineer.user_id
                      ).length

                    return (

                      <div
                        className="col-md-6 col-xl-4"
                        key={
                          engineer.user_id
                        }
                      >

                        <div className="card h-100 border-0 shadow-sm">

                          <div className="card-body p-4">

                            <div className="d-flex align-items-center gap-3 mb-3">

                              <div
                                className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                                style={{
                                  width: "55px",
                                  height: "55px",
                                  fontSize: "24px",
                                }}
                              >
                                👨‍🔧
                              </div>

                              <div>

                                <h5 className="fw-bold mb-0">
                                  {
                                    engineer.name
                                  }
                                </h5>

                                <small className="text-muted">
                                  {
                                    engineer.user_id
                                  }
                                </small>

                              </div>

                            </div>


                            <div className="mb-3">

                              <div className="text-muted small">
                                Username
                              </div>

                              <div className="fw-semibold">
                                {
                                  engineer.username
                                }
                              </div>

                            </div>


                            <div className="mb-3">

                              <div className="text-muted small">
                                Department
                              </div>

                              <div className="fw-semibold">
                                {
                                  engineer.department ||
                                  "Not assigned"
                                }
                              </div>

                            </div>


                            <div className="bg-light rounded-3 p-3 mb-3">

                              <div className="text-muted small">
                                Current Workload
                              </div>

                              <div className="fs-3 fw-bold">
                                {
                                  workload
                                }
                              </div>

                              <small className="text-muted">
                                assigned request(s)
                              </small>

                            </div>


                            <button
                              className="btn btn-outline-primary w-100"
                              onClick={() =>
                                viewEngineerWorkload(
                                  engineer
                                )
                              }
                            >
                              View Assigned Requests
                            </button>

                          </div>

                        </div>

                      </div>

                    )
                  }
                )}

              </div>

            )}

          </div>

        </div>

      )}


      {/* ======================================================
          ENGINEER WORKLOAD
      ====================================================== */}

      {activeSection ===
        "engineer-workload" && (

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div>

                <h3 className="fw-bold mb-1">
                  Engineer Workload
                </h3>

                <p className="text-muted mb-0">
                  Requests assigned to the selected engineer
                </p>

              </div>

              <button
                className="btn btn-outline-secondary"
                onClick={() =>
                  setActiveSection(
                    "engineers"
                  )
                }
              >
                ← Back
              </button>

            </div>


            {engineerRequests.length ===
            0 ? (

              <EmptyState
                title="No assigned requests"
                text="This engineer currently has no assigned requests."
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
                        Priority
                      </th>

                      <th>
                        Status
                      </th>

                      <th />

                    </tr>

                  </thead>

                  <tbody>

                    {engineerRequests.map(
                      (
                        request
                      ) => (

                        <RequestRow
                          key={
                            request.request_id
                          }
                          request={
                            request
                          }
                          onOpen={
                            openRequest
                          }
                          onCancel={
                            cancelRequest
                          }
                          detailed
                        />

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      )}


      {/* ======================================================
          REQUEST DETAILS
      ====================================================== */}

      {activeSection ===
        "details" &&
        selectedRequest && (

        <div>

          <div className="d-flex justify-content-between align-items-center mb-3">

            <div>

              <h3 className="fw-bold mb-1">
                Request Details
              </h3>

              <span className="text-muted">
                {
                  selectedRequest.request_id
                }
              </span>

            </div>

            <button
              className="btn btn-outline-secondary"
              onClick={() =>
                setActiveSection(
                  "requests"
                )
              }
            >
              ← Back
            </button>

          </div>


          {/* Request information */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">

                <div>

                  <h3 className="fw-bold mb-1">
                    {
                      selectedRequest.title
                    }
                  </h3>

                  <div className="text-muted">
                    {
                      selectedRequest.request_id
                    }
                  </div>

                </div>

                <div className="d-flex gap-2">

                  <StatusBadge
                    value={
                      selectedRequest.status
                    }
                  />

                  <PriorityBadge
                    value={
                      selectedRequest.priority
                    }
                  />

                </div>

              </div>


              <div className="row g-3 mb-4">

                <InfoBox
                  label="Department"
                  value={
                    selectedRequest.department
                  }
                />

                <InfoBox
                  label="Category"
                  value={formatLabel(
                    selectedRequest.category
                  )}
                />

                <InfoBox
                  label="Current Engineer"
                  value={
                    selectedRequest.assigned_to ||
                    "Not assigned"
                  }
                />

                <InfoBox
                  label="Status"
                  value={formatLabel(
                    selectedRequest.status
                  )}
                />

              </div>


              <div className="mb-4">

                <label className="fw-semibold">
                  Description
                </label>

                <div
                  className="bg-light rounded-3 p-3 mt-2"
                  style={{
                    whiteSpace:
                      "pre-wrap",
                  }}
                >
                  {
                    selectedRequest.description
                  }
                </div>

              </div>


              {/* Assignment */}

              <div className="border-top pt-4">

                <h5 className="fw-bold mb-3">
                  Engineer Assignment
                </h5>


                <div className="row g-3 align-items-end">

                  <div className="col-md-8">

                    <label className="form-label fw-semibold">
                      Support Engineer
                    </label>

                    <select
                      className="form-select form-select-lg"
                      value={
                        selectedEngineer
                      }
                      onChange={(e) =>
                        setSelectedEngineer(
                          e.target.value
                        )
                      }
                    >

                      <option value="">
                        Select Engineer
                      </option>

                      {engineers.map(
                        (
                          engineer
                        ) => (

                          <option
                            key={
                              engineer.user_id
                            }
                            value={
                              engineer.user_id
                            }
                          >
                            {
                              engineer.name
                            }{" "}
                            (
                            {
                              engineer.user_id
                            }
                            )
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  <div className="col-md-4">

                    {selectedRequest.assigned_to ? (

                      <button
                        className="btn btn-warning btn-lg w-100"
                        onClick={
                          reassignRequest
                        }
                      >
                        Reassign
                      </button>

                    ) : (

                      <button
                        className="btn btn-primary btn-lg w-100"
                        onClick={
                          assignRequest
                        }
                      >
                        Assign
                      </button>

                    )}

                  </div>

                </div>


                <small className="text-muted d-block mt-2">
                  Use Assign for an unassigned
                  request and Reassign when the
                  request already has an engineer.
                </small>

              </div>


              {/* ==================================================
                  CLOSE REQUEST
              ================================================== */}

              {selectedRequest.status ===
                "RESOLVED" && (

                <div className="border-top mt-4 pt-4">

                  <div className="alert alert-success mb-3">

                    <strong>
                      Request Resolved
                    </strong>

                    <div className="small mt-1">
                      The support engineer has resolved
                      this request. The Team Lead can now
                      confirm and close it.
                    </div>

                  </div>

                  <button
                    className="btn btn-success"
                    onClick={
                      closeRequest
                    }
                  >
                    ✓ Confirm & Close Request
                  </button>

                </div>

              )}


              {/* ==================================================
                  CLOSED MESSAGE
              ================================================== */}

              {selectedRequest.status ===
                "CLOSED" && (

                <div className="border-top mt-4 pt-4">

                  <div className="alert alert-secondary mb-0">

                    <strong>
                      🔒 Request Closed
                    </strong>

                    <div className="small mt-1">
                      This support request has been
                      completed and closed by the Team Lead.
                    </div>

                  </div>

                </div>

              )}


              {/* ==================================================
                  CANCEL
              ================================================== */}

              {selectedRequest.status !==
                "CLOSED" &&
                selectedRequest.status !==
                  "CANCELLED" &&
                selectedRequest.status !==
                  "RESOLVED" && (

                <div className="border-top mt-4 pt-4">

                  <button
                    className="btn btn-outline-danger"
                    onClick={() =>
                      cancelRequest(
                        selectedRequest
                      )
                    }
                  >
                    Cancel Support Request
                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  )
}


// ============================================================
// STAT CARD
// ============================================================

function TeamLeadStat({
  title,
  value,
  icon,
  type,
}) {

  const borderClasses = {
    primary: "border-primary",
    info: "border-info",
    warning: "border-warning",
    success: "border-success",
    dark: "border-dark",
  }

  return (

    <div className="col-6 col-md-4 col-xl-2">

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
// OVERVIEW ITEM
// ============================================================

function OverviewItem({
  label,
  value,
  color,
}) {

  return (

    <div className="col-6 col-md-4">

      <div className="bg-light rounded-3 p-3">

        <div className="d-flex justify-content-between align-items-center">

          <span className="text-muted">
            {label}
          </span>

          <span
            className={`badge bg-${color}`}
          >
            {value}
          </span>

        </div>

      </div>

    </div>

  )
}


// ============================================================
// REQUEST ROW
// ============================================================

function RequestRow({
  request,
  onOpen,
  onCancel,
  detailed = false,
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
          {request.title}
        </div>

        {detailed && (

          <small className="text-muted">
            {truncate(
              request.description,
              50
            )}
          </small>

        )}

      </td>


      {detailed && (

        <td>
          {request.department}
        </td>

      )}


      {detailed && (

        <td>
          {request.assigned_to ||
            "Unassigned"}
        </td>

      )}


      {!detailed && (

        <td>
          {request.department}
        </td>

      )}


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

        <div className="d-flex gap-2">

          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() =>
              onOpen(request)
            }
          >
            View
          </button>


          {request.status !==
            "CLOSED" &&
            request.status !==
              "CANCELLED" &&
            request.status !==
              "RESOLVED" && (

            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() =>
                onCancel(request)
              }
            >
              Cancel
            </button>

          )}

        </div>

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
      {value}
    </span>

  )
}


// ============================================================
// INFO BOX
// ============================================================

function InfoBox({
  label,
  value,
}) {

  return (

    <div className="col-6 col-lg-3">

      <div className="bg-light rounded-3 p-3 h-100">

        <div className="text-muted small">
          {label}
        </div>

        <div className="fw-semibold mt-1">
          {value || "-"}
        </div>

      </div>

    </div>

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
// HELPERS
// ============================================================

function formatLabel(value) {

  if (!value) return ""

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ")
}


function truncate(
  value,
  length
) {

  if (!value) return ""

  if (value.length <= length) {
    return value
  }

  return (
    value.substring(
      0,
      length
    ) + "..."
  )
}