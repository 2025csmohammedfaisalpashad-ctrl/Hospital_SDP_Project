import { useEffect, useMemo, useState } from "react"
import {
  apiGet,
  apiPost,
  apiPut,
} from "../api"

export default function EngineerPanel() {

  // ============================================================
  // USER
  // ============================================================

  const [user, setUser] = useState(null)

  // ============================================================
  // DATA
  // ============================================================

  const [requests, setRequests] = useState([])
  const [summary, setSummary] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)

  // ============================================================
  // COMMENT
  // ============================================================

  const [commentText, setCommentText] = useState("")

  // ============================================================
  // FILTERS
  // ============================================================

  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")

  // ============================================================
  // UI
  // ============================================================

  const [activeSection, setActiveSection] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // ============================================================
  // CONSTANTS
  // ============================================================

  const statuses = [
    "ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "RESOLVED",
    "CLOSED",
  ]

  const engineerStatuses = [
    "IN_PROGRESS",
    "ON_HOLD",
    "RESOLVED",
  ]

  const priorities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ]

  // ============================================================
  // LOAD USER
  // ============================================================

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      setLoading(true)
      setError("")

      const data = await apiGet("/auth/me")

      setUser(data)

      if (data.user_id) {
        await loadEngineerData(data.user_id)
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // LOAD ENGINEER DATA
  // ============================================================

  async function loadEngineerData(engineerId) {
    try {
      setLoadingRequests(true)

      const [requestData, summaryData] =
        await Promise.all([
          apiGet(
            `/engineer/${encodeURIComponent(
              engineerId
            )}/requests`
          ),

          apiGet(
            `/engineer/${encodeURIComponent(
              engineerId
            )}/summary`
          ),
        ])

      setRequests(requestData.requests || [])
      setSummary(summaryData)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingRequests(false)
    }
  }

  // ============================================================
  // REFRESH
  // ============================================================

  async function refreshData() {
    if (!user?.user_id) return

    setMessage("")
    setError("")

    await loadEngineerData(user.user_id)
  }

  // ============================================================
  // OPEN REQUEST
  // ============================================================

  async function openRequest(request) {
    setMessage("")
    setError("")

    try {

      const data = await apiGet(
        `/engineer/${encodeURIComponent(
          user.user_id
        )}/requests/${encodeURIComponent(
          request.request_id
        )}`
      )

      setSelectedRequest(data)
      setActiveSection("details")

    } catch (err) {
      setError(err.message)
    }
  }

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  async function updateStatus(newStatus) {

    if (!selectedRequest) return

    setMessage("")
    setError("")

    try {

      const data = await apiPut(
        `/engineer/${encodeURIComponent(
          user.user_id
        )}/requests/${encodeURIComponent(
          selectedRequest.request_id
        )}/status`,
        {
          status: newStatus,
        }
      )

      setMessage(
        data.message ||
          "Request status updated successfully"
      )

      // Refresh request details
      const updated = await apiGet(
        `/engineer/${encodeURIComponent(
          user.user_id
        )}/requests/${encodeURIComponent(
          selectedRequest.request_id
        )}`
      )

      setSelectedRequest(updated)

      await loadEngineerData(user.user_id)

    } catch (err) {
      setError(err.message)
    }
  }

  // ============================================================
  // ADD COMMENT
  // ============================================================

  async function addComment() {

    if (!selectedRequest) return

    if (!commentText.trim()) {
      setError("Enter a comment first")
      return
    }

    setMessage("")
    setError("")

    try {

      const data = await apiPost(
        `/engineer/${encodeURIComponent(
          user.user_id
        )}/requests/${encodeURIComponent(
          selectedRequest.request_id
        )}/comments`,
        {
          user_id: user.user_id,
          comment: commentText.trim(),
        }
      )

      setMessage(
        data.message ||
          "Comment added successfully"
      )

      setCommentText("")

    } catch (err) {
      setError(err.message)
    }
  }

  // ============================================================
  // FILTER REQUESTS
  // ============================================================

  const filteredRequests = useMemo(() => {

    return requests.filter((request) => {

      const statusMatch =
        statusFilter === "ALL" ||
        request.status === statusFilter

      const priorityMatch =
        priorityFilter === "ALL" ||
        request.priority === priorityFilter

      return statusMatch && priorityMatch
    })

  }, [
    requests,
    statusFilter,
    priorityFilter,
  ])

  // ============================================================
  // SUMMARY COUNTS
  // ============================================================

  const totalRequests =
    summary?.total_requests ?? requests.length

  const assignedRequests =
    summary?.requests?.ASSIGNED ?? 0

  const inProgressRequests =
    summary?.requests?.IN_PROGRESS ?? 0

  const onHoldRequests =
    summary?.requests?.ON_HOLD ?? 0

  const resolvedRequests =
    summary?.requests?.RESOLVED ?? 0

  const closedRequests =
    summary?.requests?.CLOSED ?? 0

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
          Loading engineer dashboard...
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
            "linear-gradient(135deg, #198754, #20c997)",
          color: "white",
        }}
      >

        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">

          <div>

            <div
              className="text-uppercase small fw-semibold"
              style={{ opacity: 0.8 }}
            >
              Support Engineer Workspace
            </div>

            <h2 className="fw-bold mb-1">
              {user?.name || user?.username}
            </h2>

            <div style={{ opacity: 0.9 }}>
              Engineer ID: {user?.user_id}
            </div>

          </div>

          <button
            className="btn btn-light"
            onClick={refreshData}
            disabled={loadingRequests}
          >
            {loadingRequests
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
            onClick={() => setMessage("")}
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
            onClick={() => setError("")}
          />

        </div>

      )}


      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <div className="d-flex flex-wrap gap-2 mb-4">

        <button
          className={`btn ${
            activeSection === "dashboard"
              ? "btn-success"
              : "btn-outline-success"
          }`}
          onClick={() =>
            setActiveSection("dashboard")
          }
        >
          Dashboard
        </button>


        <button
          className={`btn ${
            activeSection === "requests"
              ? "btn-success"
              : "btn-outline-success"
          }`}
          onClick={() =>
            setActiveSection("requests")
          }
        >
          Assigned Requests
        </button>


        {selectedRequest && (

          <button
            className={`btn ${
              activeSection === "details"
                ? "btn-success"
                : "btn-outline-success"
            }`}
            onClick={() =>
              setActiveSection("details")
            }
          >
            Request Details
          </button>

        )}

      </div>


      {/* ======================================================
          DASHBOARD
      ====================================================== */}

      {activeSection === "dashboard" && (

        <div>

          {/* Statistics */}

          <div className="row g-3 mb-4">

            <EngineerStat
              title="Total Assigned"
              value={totalRequests}
              icon="📋"
              type="primary"
            />

            <EngineerStat
              title="Assigned"
              value={assignedRequests}
              icon="👤"
              type="warning"
            />

            <EngineerStat
              title="In Progress"
              value={inProgressRequests}
              icon="⚙️"
              type="primary"
            />

            <EngineerStat
              title="On Hold"
              value={onHoldRequests}
              icon="⏸️"
              type="secondary"
            />

            <EngineerStat
              title="Resolved"
              value={resolvedRequests}
              icon="✓"
              type="success"
            />

            <EngineerStat
              title="Closed"
              value={closedRequests}
              icon="🔒"
              type="dark"
            />

          </div>


          {/* Quick Actions */}

          <div className="card border-0 shadow-sm mb-4">

            <div className="card-body p-4">

              <h4 className="fw-bold mb-3">
                Engineer Actions
              </h4>

              <div className="row g-3">

                <div className="col-md-6">

                  <button
                    className="btn btn-success w-100 py-3"
                    onClick={() =>
                      setActiveSection(
                        "requests"
                      )
                    }
                  >

                    <div className="fs-4">
                      🔧
                    </div>

                    View Assigned Requests

                  </button>

                </div>


                <div className="col-md-6">

                  <button
                    className="btn btn-outline-success w-100 py-3"
                    onClick={refreshData}
                  >

                    <div className="fs-4">
                      ↻
                    </div>

                    Refresh Workload

                  </button>

                </div>

              </div>

            </div>

          </div>


          {/* Current Work */}

          <div className="card border-0 shadow-sm">

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-center mb-3">

                <div>

                  <h4 className="fw-bold mb-1">
                    Current Work
                  </h4>

                  <p className="text-muted mb-0">
                    Your latest assigned support requests
                  </p>

                </div>

                <button
                  className="btn btn-sm btn-outline-success"
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
                  title="No assigned requests"
                  text="You currently have no support requests assigned to you."
                />

              ) : (

                <div className="table-responsive">

                  <table className="table align-middle">

                    <thead>

                      <tr>
                        <th>Request</th>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th></th>
                      </tr>

                    </thead>

                    <tbody>

                      {requests
                        .slice(0, 5)
                        .map((request) => (

                          <EngineerRequestRow
                            key={
                              request.request_id
                            }
                            request={request}
                            onOpen={
                              openRequest
                            }
                          />

                        ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          ASSIGNED REQUESTS
      ====================================================== */}

      {activeSection === "requests" && (

        <div className="card border-0 shadow-sm">

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

              <div>

                <h3 className="fw-bold mb-1">
                  Assigned Requests
                </h3>

                <p className="text-muted mb-0">
                  {filteredRequests.length} request(s) shown
                </p>

              </div>

              <button
                className="btn btn-outline-success"
                onClick={refreshData}
              >
                ↻ Refresh
              </button>

            </div>


            {/* Filters */}

            <div className="row g-3 mb-4">

              <div className="col-md-6">

                <label className="form-label fw-semibold">
                  Filter by Status
                </label>

                <select
                  className="form-select"
                  value={statusFilter}
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
                        key={status}
                        value={status}
                      >
                        {formatLabel(status)}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="col-md-6">

                <label className="form-label fw-semibold">
                  Filter by Priority
                </label>

                <select
                  className="form-select"
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="ALL">
                    All Priorities
                  </option>

                  {priorities.map(
                    (priority) => (

                      <option
                        key={priority}
                        value={priority}
                      >
                        {priority}
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>


            {/* Requests */}

            {filteredRequests.length === 0 ? (

              <EmptyState
                title="No matching requests"
                text="There are no assigned requests matching your filters."
              />

            ) : (

              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead className="table-light">

                    <tr>
                      <th>Request ID</th>
                      <th>Title</th>
                      <th>Department</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>

                  </thead>

                  <tbody>

                    {filteredRequests.map(
                      (request) => (

                        <EngineerRequestRow
                          key={
                            request.request_id
                          }
                          request={request}
                          onOpen={
                            openRequest
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

      {activeSection === "details" &&
        selectedRequest && (

          <div>

            <div className="d-flex justify-content-between align-items-center mb-3">

              <div>

                <h3 className="fw-bold mb-1">
                  Request Details
                </h3>

                <span className="text-muted">
                  {selectedRequest.request_id}
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
                      {selectedRequest.title}
                    </h3>

                    <div className="text-muted">
                      {selectedRequest.request_id}
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


                {/* Information */}

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
                    label="Assigned Engineer"
                    value={
                      selectedRequest.assigned_to ||
                      "Not assigned"
                    }
                  />

                  <InfoBox
                    label="Priority"
                    value={
                      selectedRequest.priority
                    }
                  />

                </div>


                {/* Description */}

                <div className="mb-4">

                  <label className="fw-semibold">
                    Problem Description
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


                {/* Status Update */}

                <div className="border-top pt-4">

                  <h5 className="fw-bold mb-3">
                    Update Request Status
                  </h5>

                  <div className="row g-2">

                    {engineerStatuses.map(
                      (status) => (

                        <div
                          className="col-md-4"
                          key={status}
                        >

                          <button
                            className={`btn w-100 ${
                              selectedRequest.status ===
                              status
                                ? "btn-success"
                                : "btn-outline-success"
                            }`}
                            onClick={() =>
                              updateStatus(
                                status
                              )
                            }
                            disabled={
                              selectedRequest.status ===
                              status
                            }
                          >
                            {statusIcon(
                              status
                            )}{" "}
                            {formatLabel(
                              status
                            )}
                          </button>

                        </div>

                      )
                    )}

                  </div>

                  <small className="text-muted d-block mt-2">
                    Engineers can move assigned
                    requests to IN_PROGRESS,
                    ON_HOLD, or RESOLVED.
                  </small>

                </div>

              </div>

            </div>


            {/* Resolution / Comment */}

            <div className="card border-0 shadow-sm">

              <div className="card-body p-4">

                <h4 className="fw-bold mb-2">
                  Engineer Notes
                </h4>

                <p className="text-muted">
                  Add a technical update,
                  troubleshooting note, or
                  resolution note for this request.
                </p>


                <textarea
                  className="form-control mb-3"
                  rows="5"
                  placeholder="Example: Replaced the faulty power module and tested the equipment successfully."
                  value={commentText}
                  onChange={(e) =>
                    setCommentText(
                      e.target.value
                    )
                  }
                />


                <div className="d-flex justify-content-end">

                  <button
                    className="btn btn-success"
                    onClick={addComment}
                  >
                    Add Engineer Note
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

    </div>
  )
}


// ============================================================
// ENGINEER STAT
// ============================================================

function EngineerStat({
  title,
  value,
  icon,
  type,
}) {

  const borderClasses = {
    primary: "border-primary",
    warning: "border-warning",
    secondary: "border-secondary",
    success: "border-success",
    dark: "border-dark",
  }

  return (

    <div className="col-6 col-md-4 col-xl-2">

      <div
        className={`card h-100 shadow-sm border-start border-4 ${
          borderClasses[type] ||
          "border-success"
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

function EngineerRequestRow({
  request,
  onOpen,
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
              55
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
          {formatLabel(
            request.category
          )}
        </td>

      )}


      <td>

        <PriorityBadge
          value={request.priority}
        />

      </td>


      <td>

        <StatusBadge
          value={request.status}
        />

      </td>


      <td>

        <button
          className="btn btn-sm btn-outline-success"
          onClick={() =>
            onOpen(request)
          }
        >
          View
        </button>

      </td>

    </tr>
  )
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ value }) {

  const classes = {
    ASSIGNED:
      "bg-warning-subtle text-warning-emphasis",

    IN_PROGRESS:
      "bg-primary-subtle text-primary-emphasis",

    ON_HOLD:
      "bg-secondary-subtle text-secondary-emphasis",

    RESOLVED:
      "bg-success-subtle text-success-emphasis",

    CLOSED:
      "bg-dark-subtle text-dark-emphasis",
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

function PriorityBadge({ value }) {

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
        🔧
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
    value.substring(0, length) +
    "..."
  )
}


function statusIcon(status) {

  const icons = {
    IN_PROGRESS: "⚙️",
    ON_HOLD: "⏸️",
    RESOLVED: "✓",
  }

  return icons[status] || "•"
}