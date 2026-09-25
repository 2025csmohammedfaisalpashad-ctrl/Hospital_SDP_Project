import { useEffect, useState } from "react"

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from "../api"


export default function AdminPanel() {

  // ============================================================
  // DEPARTMENT STATE
  // ============================================================

  const [deptName, setDeptName] = useState("")
  const [deptDesc, setDeptDesc] = useState("")
  const [departments, setDepartments] = useState([])
  const [editingDepartment, setEditingDepartment] = useState(null)


  // ============================================================
  // CATEGORY STATE
  // ============================================================

  const [catName, setCatName] = useState("")
  const [catDesc, setCatDesc] = useState("")
  const [categories, setCategories] = useState([])
  const [editingCategory, setEditingCategory] = useState(null)


  // ============================================================
  // USER STATE
  // ============================================================

  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [username, setUsername] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [role, setRole] = useState("SUPPORT_ENGINEER")
  const [userDept, setUserDept] = useState("")


  // ============================================================
  // REQUEST STATE
  // ============================================================

  const [requests, setRequests] = useState([])

  const [requestStatusFilter, setRequestStatusFilter] =
    useState("ALL")

  const [requestDepartmentFilter, setRequestDepartmentFilter] =
    useState("ALL")

  const [selectedRequest, setSelectedRequest] =
    useState(null)

  const [loadingRequests, setLoadingRequests] =
    useState(false)


  // ============================================================
  // SUMMARY STATE
  // ============================================================

  const [summary, setSummary] = useState(null)

  const [loadingSummary, setLoadingSummary] =
    useState(false)


  // ============================================================
  // MESSAGE / ERROR
  // ============================================================

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    LoadDepartments()

    LoadCategories()

    LoadRequests()

  }, [])


  // ============================================================
  // DEPARTMENT FUNCTIONS
  // ============================================================

  function LoadDepartments() {

    apiGet("/admin/departments")

      .then((data) => {

        setDepartments(
          Array.isArray(data.departments)
            ? data.departments
            : []
        )

      })

      .catch((err) => {

        setError(err.message)

      })
  }


  function CreateDepartment() {

    setMessage("")
    setError("")

    if (!deptName.trim()) {

      setError("Department name is required")

      return
    }

    apiPost("/admin/departments", {

      name: deptName.trim(),

      description: deptDesc.trim(),

    })

      .then((data) => {

        setMessage(data.message)

        setDeptName("")
        setDeptDesc("")

        LoadDepartments()

      })

      .catch((err) => {

        setError(err.message)

      })
  }


  function StartEditDepartment(department) {

    setEditingDepartment(department.name)

    setDeptName(department.name)

    setDeptDesc(
      department.description || ""
    )

    setMessage("")
    setError("")
  }


  function CancelEditDepartment() {

    setEditingDepartment(null)

    setDeptName("")
    setDeptDesc("")

    setMessage("")
    setError("")
  }


  function UpdateDepartment() {

    setMessage("")
    setError("")

    if (!deptName.trim()) {

      setError("Department name is required")

      return
    }

    apiPut(

      `/admin/departments/${encodeURIComponent(
        editingDepartment
      )}`,

      {

        name: deptName.trim(),

        description: deptDesc.trim(),

      }

    )

      .then((data) => {

        setMessage(data.message)

        setEditingDepartment(null)

        setDeptName("")
        setDeptDesc("")

        LoadDepartments()

      })

      .catch((err) => {

        setError(err.message)

      })
  }


  function DeleteDepartment(name) {

    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"?`
      )
    ) {

      return
    }

    setMessage("")
    setError("")

    apiDelete(

      `/admin/departments/${encodeURIComponent(
        name
      )}`

    )

      .then((data) => {

        setMessage(data.message)

        LoadDepartments()

      })

      .catch((err) => {

        setError(err.message)

      })
  }


  // ============================================================
  // CATEGORY FUNCTIONS
  // ============================================================

  function LoadCategories() {

    apiGet("/admin/categories")

      .then((data) => {

        setCategories(
          Array.isArray(data.categories)
            ? data.categories
            : []
        )

      })

      .catch((err) => {

        setError(err.message)

      })
  }


  function CreateCategory() {

    setMessage("")
    setError("")

    if (!catName.trim()) {

      setError("Category name is required")

      return
    }

    apiPost("/admin/categories", {

      name: catName.trim(),

      description: catDesc.trim(),

    })

      .then((data) => {

        setMessage(data.message)

        setCatName("")
        setCatDesc("")

        LoadCategories()

      })

      .catch((err) => {

        setError(err.message)

      })
  }


  function StartEditCategory(category) {

    setEditingCategory(category.name)

    setCatName(category.name)

    setCatDesc(
      category.description || ""
    )

    setMessage("")
    setError("")
  }


  function CancelEditCategory() {

    setEditingCategory(null)

    setCatName("")
    setCatDesc("")

    setMessage("")
    setError("")
  }


  function UpdateCategory() {

    setMessage("")
    setError("")

    if (!catName.trim()) {

      setError("Category name is required")

      return
    }

    apiPut(

      `/admin/categories/${encodeURIComponent(
        editingCategory
      )}`,

      {

        name: catName.trim(),

        description: catDesc.trim(),

      }

    )

      .then((data) => {

        setMessage(data.message)

        setEditingCategory(null)

        setCatName("")
        setCatDesc("")

        LoadCategories()

      })

      .catch((err) => {

        setError(err.message)

      })
  }


  function DeleteCategory(name) {

    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"?`
      )
    ) {

      return
    }

    setMessage("")
    setError("")

    apiDelete(

      `/admin/categories/${encodeURIComponent(
        name
      )}`

    )

      .then((data) => {

        setMessage(data.message)

        LoadCategories()

      })

      .catch((err) => {

        setError(err.message)

      })
  }


  // ============================================================
  // USER FUNCTION
  // ============================================================

  function CreateUser() {

    setMessage("")
    setError("")

    if (
      !userId.trim() ||
      !userName.trim() ||
      !username.trim() ||
      !userPassword ||
      !role
    ) {

      setError(
        "Please fill all required user fields"
      )

      return
    }

    apiPost("/admin/users", {

      user_id: userId.trim(),

      name: userName.trim(),

      username: username.trim(),

      password: userPassword,

      role: role,

      department: userDept.trim(),

    })

      .then((data) => {

        setMessage(data.message)

        setUserId("")
        setUserName("")
        setUsername("")
        setUserPassword("")

        setRole("SUPPORT_ENGINEER")

        setUserDept("")

      })

      .catch((err) => {

        setError(err.message)

      })
  }


  // ============================================================
  // REQUEST FUNCTIONS
  // ============================================================

  function LoadRequests() {

    setLoadingRequests(true)

    apiGet("/admin/requests")

      .then((data) => {

        console.log(
          "Admin Requests:",
          data
        )

        setRequests(
          Array.isArray(data.requests)
            ? data.requests
            : []
        )

      })

      .catch((err) => {

        console.error(
          "Request loading error:",
          err
        )

        setError(
          `Unable to load requests: ${err.message}`
        )

      })

      .finally(() => {

        setLoadingRequests(false)

      })
  }


  // ============================================================
  // REQUEST HELPER FUNCTIONS
  // ============================================================

  function GetRaisedBy(request) {

    return (
      request?.created_by ||
      request?.raised_by ||
      request?.user_id ||
      request?.requester_id ||
      request?.createdBy ||
      "Not specified"
    )
  }


  function GetAssignedEngineer(request) {

    return (
      request?.assigned_to ||
      request?.engineer_id ||
      request?.assigned_engineer ||
      "Not assigned"
    )
  }


  function GetDescription(request) {

    return (
      request?.description ||
      request?.issue ||
      request?.problem ||
      request?.details ||
      "No description provided."
    )
  }


  function GetRequestId(request) {

    return (
      request?.request_id ||
      request?.id ||
      request?._id ||
      "Unknown"
    )
  }


  function GetStatus(request) {

    return (
      request?.status ||
      "UNKNOWN"
    )
  }


  function GetCategory(request) {

    return (
      request?.category ||
      "Not specified"
    )
  }


  function GetDepartment(request) {

    return (
      request?.department ||
      "Not specified"
    )
  }


  function GetCreatedDate(request) {

    const value =
      request?.created_at ||
      request?.createdAt

    if (!value) {

      return "Not available"

    }

    try {

      return new Date(value).toLocaleString()

    } catch {

      return String(value)

    }
  }


  // ============================================================
  // FILTER REQUESTS
  // ============================================================

  const filteredRequests =
    requests.filter((request) => {

      const statusMatch =
        requestStatusFilter === "ALL" ||
        String(
          GetStatus(request)
        ).toUpperCase() ===
          requestStatusFilter


      const departmentMatch =
        requestDepartmentFilter === "ALL" ||
        String(
          GetDepartment(request)
        ) ===
          requestDepartmentFilter


      return (
        statusMatch &&
        departmentMatch
      )

    })


  // ============================================================
  // SUMMARY
  // ============================================================

  function LoadSummary() {

    setMessage("")
    setError("")
    setLoadingSummary(true)

    apiGet("/admin/summary")

      .then((data) => {

        console.log(
          "Admin Summary:",
          data
        )

        const safeSummary = {

          system:
            data?.system ||
            "Hospital Support Request System",

          users:
            Number(data?.users) || 0,

          departments:
            Number(data?.departments) || 0,

          categories:
            Number(data?.categories) || 0,

          requests: {

            total:
              Number(
                data?.requests?.total
              ) || 0,

            NEW:
              Number(
                data?.requests?.NEW
              ) || 0,

            ASSIGNED:
              Number(
                data?.requests?.ASSIGNED
              ) || 0,

            IN_PROGRESS:
              Number(
                data?.requests?.IN_PROGRESS
              ) || 0,

            RESOLVED:
              Number(
                data?.requests?.RESOLVED
              ) || 0,

            CLOSED:
              Number(
                data?.requests?.CLOSED
              ) || 0,

          },

        }

        setSummary(
          safeSummary
        )

      })

      .catch((err) => {

        console.error(
          "Summary Error:",
          err
        )

        setSummary(null)

        setError(
          `Unable to load summary: ${err.message}`
        )

      })

      .finally(() => {

        setLoadingSummary(false)

      })
  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div
      className="container-fluid py-3"
      style={{
        background: "#f5f7fb",
        minHeight: "100vh"
      }}
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="rounded-4 p-4 p-lg-5 mb-4 text-white shadow"
        style={{
          background:
            "linear-gradient(135deg, #172033 0%, #234b8f 55%, #3174c7 100%)"
        }}
      >

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

          <div>

            <div
              className="small text-uppercase mb-2"
              style={{
                letterSpacing: "2px",
                opacity: 0.7
              }}
            >
              Hospital Support System
            </div>


            <h1 className="fw-bold mb-2">
              Admin Control Center
            </h1>


            <p
              className="mb-0"
              style={{
                opacity: 0.8
              }}
            >
              Manage departments, categories, users, requests and system information.
            </p>

          </div>


          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: "75px",
              height: "75px",
              background:
                "rgba(255,255,255,0.15)",
              fontSize: "35px"
            }}
          >
            🏥
          </div>

        </div>

      </div>


      {/* ======================================================
          MESSAGE
      ====================================================== */}

      {message && (

        <div className="alert alert-success border-0 shadow-sm rounded-3">

          ✓ {message}

        </div>

      )}


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="alert alert-danger border-0 shadow-sm rounded-3">

          ⚠ {error}

        </div>

      )}


      {/* ======================================================
          DASHBOARD CARDS
      ====================================================== */}

      <div className="row g-3 mb-4">


        <div className="col-6 col-lg-3">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

              <div className="d-flex justify-content-between">

                <div>

                  <small className="text-muted">
                    Departments
                  </small>

                  <h2 className="fw-bold mb-0">
                    {departments.length}
                  </h2>

                </div>

                <span className="fs-2">
                  🏥
                </span>

              </div>

            </div>

          </div>

        </div>


        <div className="col-6 col-lg-3">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

              <div className="d-flex justify-content-between">

                <div>

                  <small className="text-muted">
                    Categories
                  </small>

                  <h2 className="fw-bold mb-0">
                    {categories.length}
                  </h2>

                </div>

                <span className="fs-2">
                  🗂️
                </span>

              </div>

            </div>

          </div>

        </div>


        <div className="col-6 col-lg-3">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

              <div className="d-flex justify-content-between">

                <div>

                  <small className="text-muted">
                    Requests
                  </small>

                  <h2 className="fw-bold mb-0">
                    {requests.length}
                  </h2>

                </div>

                <span className="fs-2">
                  📋
                </span>

              </div>

            </div>

          </div>

        </div>


        <div className="col-6 col-lg-3">

          <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

              <div className="d-flex justify-content-between">

                <div>

                  <small className="text-muted">
                    System
                  </small>

                  <h2 className="fw-bold mb-0">
                    Active
                  </h2>

                </div>

                <span className="fs-2">
                  🟢
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ======================================================
          DEPARTMENT MANAGEMENT
      ====================================================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body p-4">

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">

            <div>

              <h3 className="fw-bold mb-1">
                🏥 Department Management
              </h3>

              <p className="text-muted mb-0">
                Add, update and remove hospital departments.
              </p>

            </div>


            <span className="badge bg-primary rounded-pill px-3 py-2">

              {departments.length} Departments

            </span>

          </div>


          <div className="row g-3">

            <div className="col-lg-5">

              <label className="form-label fw-semibold">
                Department Name
              </label>

              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Example: Nursing"
                value={deptName}
                onChange={(e) =>
                  setDeptName(e.target.value)
                }
              />

            </div>


            <div className="col-lg-7">

              <label className="form-label fw-semibold">
                Description
              </label>

              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Department description"
                value={deptDesc}
                onChange={(e) =>
                  setDeptDesc(e.target.value)
                }
              />

            </div>

          </div>


          <div className="mt-3">

            {editingDepartment ? (

              <div className="d-flex gap-2">

                <button
                  className="btn btn-success px-4"
                  onClick={UpdateDepartment}
                >
                  ✓ Update Department
                </button>


                <button
                  className="btn btn-outline-secondary px-4"
                  onClick={CancelEditDepartment}
                >
                  Cancel
                </button>

              </div>

            ) : (

              <button
                className="btn btn-primary px-4"
                onClick={CreateDepartment}
              >
                + Add Department
              </button>

            )}

          </div>


          <hr className="my-4" />


          <div className="d-flex justify-content-between align-items-center mb-3">

            <h5 className="fw-bold mb-0">
              Existing Departments
            </h5>


            <button
              className="btn btn-sm btn-outline-primary"
              onClick={LoadDepartments}
            >
              ↻ Refresh
            </button>

          </div>


          {departments.length === 0 ? (

            <div className="text-center py-4">

              <div className="fs-1">
                🏥
              </div>

              <h6 className="fw-bold">
                No departments found
              </h6>

              <p className="text-muted mb-0">
                Add your first department above.
              </p>

            </div>

          ) : (

            <div className="row g-3">

              {departments.map((department) => (

                <div
                  className="col-md-6 col-xl-4"
                  key={department.name}
                >

                  <div
                    className="card h-100 border-0"
                    style={{
                      background: "#f8fafc",
                      borderRadius: "16px"
                    }}
                  >

                    <div className="card-body p-4">

                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: "48px",
                          height: "48px",
                          background: "#dbeafe",
                          fontSize: "23px"
                        }}
                      >
                        🏥
                      </div>


                      <h5 className="fw-bold">
                        {department.name}
                      </h5>


                      <p className="text-muted small">

                        {department.description ||
                          "No description provided."}

                      </p>


                      <div className="d-flex gap-2 mt-3">

                        <button
                          className="btn btn-sm btn-outline-primary flex-grow-1"
                          onClick={() =>
                            StartEditDepartment(
                              department
                            )
                          }
                        >
                          Edit
                        </button>


                        <button
                          className="btn btn-sm btn-outline-danger flex-grow-1"
                          onClick={() =>
                            DeleteDepartment(
                              department.name
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>


      {/* ======================================================
          CATEGORY MANAGEMENT
      ====================================================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body p-4">

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">

            <div>

              <h3 className="fw-bold mb-1">
                🗂️ Category Management
              </h3>

              <p className="text-muted mb-0">
                Create, update and manage support request categories.
              </p>

            </div>


            <span className="badge bg-primary rounded-pill px-3 py-2">

              {categories.length} Categories

            </span>

          </div>


          <div className="row g-3">

            <div className="col-lg-5">

              <label className="form-label fw-semibold">
                Category Name
              </label>

              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Example: EQUIPMENT_ISSUE"
                value={catName}
                onChange={(e) =>
                  setCatName(e.target.value)
                }
              />

            </div>


            <div className="col-lg-7">

              <label className="form-label fw-semibold">
                Description
              </label>

              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Category description"
                value={catDesc}
                onChange={(e) =>
                  setCatDesc(e.target.value)
                }
              />

            </div>

          </div>


          <div className="mt-3">

            {editingCategory ? (

              <div className="d-flex gap-2">

                <button
                  className="btn btn-success px-4"
                  onClick={UpdateCategory}
                >
                  ✓ Update Category
                </button>


                <button
                  className="btn btn-outline-secondary px-4"
                  onClick={CancelEditCategory}
                >
                  Cancel
                </button>

              </div>

            ) : (

              <button
                className="btn btn-primary px-4"
                onClick={CreateCategory}
              >
                + Add Category
              </button>

            )}

          </div>


          <hr className="my-4" />


          <div className="d-flex justify-content-between align-items-center mb-3">

            <h5 className="fw-bold mb-0">
              Existing Categories
            </h5>


            <button
              className="btn btn-sm btn-outline-primary"
              onClick={LoadCategories}
            >
              ↻ Refresh
            </button>

          </div>


          {categories.length === 0 ? (

            <div className="text-center py-4">

              <div className="fs-1">
                🗂️
              </div>

              <h6 className="fw-bold">
                No categories found
              </h6>

              <p className="text-muted mb-0">
                Add your first category above.
              </p>

            </div>

          ) : (

            <div className="row g-3">

              {categories.map((category) => (

                <div
                  className="col-md-6 col-xl-4"
                  key={category.name}
                >

                  <div
                    className="card h-100 border-0"
                    style={{
                      background: "#f8fafc",
                      borderRadius: "16px"
                    }}
                  >

                    <div className="card-body p-4">

                      <div className="d-flex justify-content-between align-items-start">

                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center mb-3"
                          style={{
                            width: "48px",
                            height: "48px",
                            background: "#ede9fe",
                            fontSize: "23px"
                          }}
                        >
                          🗂️
                        </div>


                        <span className="badge bg-light text-dark border">
                          Category
                        </span>

                      </div>


                      <h5
                        className="fw-bold"
                        style={{
                          wordBreak: "break-word"
                        }}
                      >
                        {category.name}
                      </h5>


                      <p className="text-muted small">

                        {category.description ||
                          "No description provided."}

                      </p>


                      <div className="d-flex gap-2 mt-3">

                        <button
                          className="btn btn-sm btn-outline-primary flex-grow-1"
                          onClick={() =>
                            StartEditCategory(
                              category
                            )
                          }
                        >
                          Edit
                        </button>


                        <button
                          className="btn btn-sm btn-outline-danger flex-grow-1"
                          onClick={() =>
                            DeleteCategory(
                              category.name
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>


      {/* ======================================================
          USER MANAGEMENT
      ====================================================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body p-4">

          <div className="mb-4">

            <h3 className="fw-bold mb-1">
              👥 User Management
            </h3>

            <p className="text-muted">
              Create accounts for staff, engineers,
              team leads and administrators.
            </p>

          </div>


          <div className="row g-3">

            <div className="col-md-6">

              <label className="form-label fw-semibold">
                User ID
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Example: ENG301"
                value={userId}
                onChange={(e) =>
                  setUserId(e.target.value)
                }
              />

            </div>


            <div className="col-md-6">

              <label className="form-label fw-semibold">
                Full Name
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Example: Rahul Kumar"
                value={userName}
                onChange={(e) =>
                  setUserName(e.target.value)
                }
              />

            </div>


            <div className="col-md-6">

              <label className="form-label fw-semibold">
                Username
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Login username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
              />

            </div>


            <div className="col-md-6">

              <label className="form-label fw-semibold">
                Password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Initial password"
                value={userPassword}
                onChange={(e) =>
                  setUserPassword(e.target.value)
                }
              />

            </div>


            <div className="col-md-6">

              <label className="form-label fw-semibold">
                Role
              </label>

              <select
                className="form-select"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
              >

                <option value="DEPARTMENT_STAFF">
                  Staff Member
                </option>

                <option value="SUPPORT_ENGINEER">
                  Support Engineer
                </option>

                <option value="TEAM_LEAD">
                  Team Lead
                </option>

                <option value="ADMIN">
                  Administrator
                </option>

              </select>

            </div>


            <div className="col-md-6">

              <label className="form-label fw-semibold">
                Department
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Example: Nursing"
                value={userDept}
                onChange={(e) =>
                  setUserDept(e.target.value)
                }
              />

            </div>

          </div>


          <button
            className="btn btn-primary px-4 mt-4"
            onClick={CreateUser}
          >
            + Create User
          </button>

        </div>

      </div>


      {/* ======================================================
          REQUEST MANAGEMENT
      ====================================================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body p-4">


          {/* REQUEST HEADER */}

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

            <div>

              <h3 className="fw-bold mb-1">
                📋 Request Management
              </h3>

              <p className="text-muted mb-0">
                View all hospital support requests, request details and assigned engineers.
              </p>

            </div>


            <button
              className="btn btn-outline-primary"
              onClick={LoadRequests}
              disabled={loadingRequests}
            >

              {loadingRequests ? (

                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />

                  Loading...

                </>

              ) : (

                <>
                  ↻ Refresh Requests
                </>

              )}

            </button>

          </div>


          {/* REQUEST STATISTICS */}

          <div className="row g-3 mb-4">

            <div className="col-6 col-md-3">

              <div
                className="rounded-4 p-3"
                style={{
                  background: "#eff6ff"
                }}
              >

                <small className="text-muted">
                  Total Requests
                </small>

                <h3 className="fw-bold mb-0">
                  {requests.length}
                </h3>

              </div>

            </div>


            <div className="col-6 col-md-3">

              <div
                className="rounded-4 p-3"
                style={{
                  background: "#fef3c7"
                }}
              >

                <small className="text-muted">
                  New
                </small>

                <h3 className="fw-bold mb-0">

                  {
                    requests.filter(
                      (r) =>
                        String(
                          GetStatus(r)
                        ).toUpperCase() ===
                        "NEW"
                    ).length
                  }

                </h3>

              </div>

            </div>


            <div className="col-6 col-md-3">

              <div
                className="rounded-4 p-3"
                style={{
                  background: "#e0e7ff"
                }}
              >

                <small className="text-muted">
                  In Progress
                </small>

                <h3 className="fw-bold mb-0">

                  {
                    requests.filter(
                      (r) =>
                        String(
                          GetStatus(r)
                        ).toUpperCase() ===
                        "IN_PROGRESS"
                    ).length
                  }

                </h3>

              </div>

            </div>


            <div className="col-6 col-md-3">

              <div
                className="rounded-4 p-3"
                style={{
                  background: "#dcfce7"
                }}
              >

                <small className="text-muted">
                  Resolved
                </small>

                <h3 className="fw-bold mb-0">

                  {
                    requests.filter(
                      (r) =>
                        String(
                          GetStatus(r)
                        ).toUpperCase() ===
                        "RESOLVED"
                    ).length
                  }

                </h3>

              </div>

            </div>

          </div>


          {/* FILTERS */}

          <div
            className="rounded-4 p-3 mb-4"
            style={{
              background: "#f8fafc"
            }}
          >

            <div className="row g-3">

              <div className="col-md-6">

                <label className="form-label fw-semibold">
                  Filter by Status
                </label>

                <select
                  className="form-select"
                  value={requestStatusFilter}
                  onChange={(e) =>
                    setRequestStatusFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="ALL">
                    All Statuses
                  </option>

                  <option value="NEW">
                    New
                  </option>

                  <option value="ASSIGNED">
                    Assigned
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="RESOLVED">
                    Resolved
                  </option>

                  <option value="CONFIRMED">
                    Confirmed
                  </option>

                  <option value="CLOSED">
                    Closed
                  </option>

                </select>

              </div>


              <div className="col-md-6">

                <label className="form-label fw-semibold">
                  Filter by Department
                </label>

                <select
                  className="form-select"
                  value={requestDepartmentFilter}
                  onChange={(e) =>
                    setRequestDepartmentFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="ALL">
                    All Departments
                  </option>


                  {departments.map(
                    (department) => (

                      <option
                        key={department.name}
                        value={department.name}
                      >
                        {department.name}
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>

          </div>


          {/* REQUEST LIST */}

          {loadingRequests ? (

            <div className="text-center py-5">

              <div
                className="spinner-border text-primary"
                role="status"
              />

              <p className="text-muted mt-3 mb-0">
                Loading requests...
              </p>

            </div>

          ) : filteredRequests.length === 0 ? (

            <div className="text-center py-5">

              <div className="fs-1">
                📭
              </div>

              <h5 className="fw-bold mt-2">
                No requests found
              </h5>

              <p className="text-muted mb-0">
                There are no requests matching the selected filters.
              </p>

            </div>

          ) : (

            <div className="row g-3">

              {filteredRequests.map(
                (request, index) => {

                  const requestId =
                    GetRequestId(request)

                  const status =
                    String(
                      GetStatus(request)
                    ).toUpperCase()


                  return (

                    <div
                      className="col-12"
                      key={
                        requestId !== "Unknown"
                          ? requestId
                          : index
                      }
                    >

                      <div
                        className="card border-0 shadow-sm"
                        style={{
                          background: "#f8fafc",
                          borderRadius: "18px"
                        }}
                      >

                        <div className="card-body p-4">

                          {/* TOP */}

                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">

                            <div className="d-flex gap-3">

                              <div
                                className="rounded-3 d-flex align-items-center justify-content-center"
                                style={{
                                  width: "52px",
                                  height: "52px",
                                  background: "#dbeafe",
                                  fontSize: "25px",
                                  flexShrink: 0
                                }}
                              >
                                📋
                              </div>


                              <div>

                                <div className="small text-muted">
                                  Request ID
                                </div>

                                <h5 className="fw-bold mb-1">
                                  {requestId}
                                </h5>

                                <div className="text-muted small">
                                  {GetCreatedDate(
                                    request
                                  )}
                                </div>

                              </div>

                            </div>


                            <StatusBadge
                              status={status}
                            />

                          </div>


                          <hr />


                          {/* REQUEST INFORMATION */}

                          <div className="row g-3">


                            <InfoItem
                              label="Category"
                              value={GetCategory(
                                request
                              )}
                              icon="🗂️"
                            />


                            <InfoItem
                              label="Department"
                              value={GetDepartment(
                                request
                              )}
                              icon="🏥"
                            />


                            <InfoItem
                              label="Raised By"
                              value={GetRaisedBy(
                                request
                              )}
                              icon="👤"
                            />


                            <InfoItem
                              label="Assigned Engineer"
                              value={GetAssignedEngineer(
                                request
                              )}
                              icon="👨‍🔧"
                            />

                          </div>


                          {/* DESCRIPTION */}

                          <div className="mt-4">

                            <div className="small text-muted fw-semibold mb-2">
                              REQUEST DESCRIPTION
                            </div>


                            <div
                              className="rounded-3 p-3"
                              style={{
                                background: "#ffffff",
                                border:
                                  "1px solid #e5e7eb"
                              }}
                            >

                              <span
                                style={{
                                  whiteSpace:
                                    "pre-wrap"
                                }}
                              >
                                {GetDescription(
                                  request
                                )}
                              </span>

                            </div>

                          </div>


                          {/* BOTTOM */}

                          <div className="d-flex justify-content-end mt-4">

                            <button
                              className="btn btn-outline-primary"
                              onClick={() =>
                                setSelectedRequest(
                                  request
                                )
                              }
                            >
                              🔎 View Full Details
                            </button>

                          </div>

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


      {/* ======================================================
          SYSTEM SUMMARY
      ====================================================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body p-4">


          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

            <div>

              <h3 className="fw-bold mb-1">
                📊 System Summary
              </h3>

              <p className="text-muted mb-0">
                View the current hospital support system information.
              </p>

            </div>


            <button
              className="btn btn-outline-primary"
              onClick={LoadSummary}
              disabled={loadingSummary}
            >

              {loadingSummary ? (

                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />

                  Loading...

                </>

              ) : (

                "Load Summary"

              )}

            </button>

          </div>


          {summary && (

            <div className="mt-4">


              {/* SUMMARY CARDS */}

              <div className="row g-3">


                <SummaryCard
                  title="Users"
                  value={summary.users}
                  icon="👥"
                />


                <SummaryCard
                  title="Departments"
                  value={summary.departments}
                  icon="🏥"
                />


                <SummaryCard
                  title="Categories"
                  value={summary.categories}
                  icon="🗂️"
                />


                <SummaryCard
                  title="Requests"
                  value={
                    summary.requests.total
                  }
                  icon="📋"
                />

              </div>


              {/* REQUEST STATUS */}

              <div className="mt-4">

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <h5 className="fw-bold mb-0">
                    Request Status
                  </h5>


                  <span className="badge bg-primary rounded-pill px-3 py-2">

                    {
                      summary.requests.total
                    } Total Requests

                  </span>

                </div>


                <div className="row g-3">


                  <StatusCard
                    title="New"
                    value={
                      summary.requests.NEW
                    }
                  />


                  <StatusCard
                    title="Assigned"
                    value={
                      summary.requests.ASSIGNED
                    }
                  />


                  <StatusCard
                    title="In Progress"
                    value={
                      summary.requests.IN_PROGRESS
                    }
                  />


                  <StatusCard
                    title="Resolved"
                    value={
                      summary.requests.RESOLVED
                    }
                  />


                  <StatusCard
                    title="Closed"
                    value={
                      summary.requests.CLOSED
                    }
                  />

                </div>

              </div>


              {/* SYSTEM INFORMATION */}

              <div className="mt-4">

                <div
                  className="rounded-4 p-3"
                  style={{
                    background: "#f8fafc"
                  }}
                >

                  <small className="text-muted">
                    System
                  </small>

                  <div className="fw-semibold">
                    {summary.system}
                  </div>

                </div>

              </div>

            </div>

          )}


          {!summary && !loadingSummary && (

            <div className="text-center py-4 mt-3">

              <div className="fs-1">
                📊
              </div>

              <h6 className="fw-bold mt-2">
                Summary not loaded
              </h6>

              <p className="text-muted mb-0">
                Click "Load Summary" to view system statistics.
              </p>

            </div>

          )}

        </div>

      </div>


      {/* ======================================================
          REQUEST DETAILS MODAL
      ====================================================== */}

      {selectedRequest && (

        <div
          className="modal d-block"
          tabIndex="-1"
          style={{
            background:
              "rgba(0,0,0,0.45)"
          }}
        >

          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
          >

            <div className="modal-content border-0 shadow-lg rounded-4">


              {/* MODAL HEADER */}

              <div className="modal-header">

                <div>

                  <div className="small text-muted">
                    Request Details
                  </div>

                  <h5 className="modal-title fw-bold">
                    {GetRequestId(
                      selectedRequest
                    )}
                  </h5>

                </div>


                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setSelectedRequest(null)
                  }
                />

              </div>


              {/* MODAL BODY */}

              <div className="modal-body">

                <div className="row g-3">


                  <InfoItem
                    label="Request ID"
                    value={GetRequestId(
                      selectedRequest
                    )}
                    icon="🆔"
                  />


                  <InfoItem
                    label="Status"
                    value={GetStatus(
                      selectedRequest
                    )}
                    icon="🔄"
                  />


                  <InfoItem
                    label="Category"
                    value={GetCategory(
                      selectedRequest
                    )}
                    icon="🗂️"
                  />


                  <InfoItem
                    label="Department"
                    value={GetDepartment(
                      selectedRequest
                    )}
                    icon="🏥"
                  />


                  <InfoItem
                    label="Raised By"
                    value={GetRaisedBy(
                      selectedRequest
                    )}
                    icon="👤"
                  />


                  <InfoItem
                    label="Assigned Engineer"
                    value={GetAssignedEngineer(
                      selectedRequest
                    )}
                    icon="👨‍🔧"
                  />

                </div>


                <div className="mt-4">

                  <h6 className="fw-bold">
                    Request Description
                  </h6>


                  <div
                    className="rounded-3 p-3"
                    style={{
                      background: "#f8fafc",
                      border:
                        "1px solid #e5e7eb"
                    }}
                  >

                    <div
                      style={{
                        whiteSpace:
                          "pre-wrap"
                      }}
                    >
                      {GetDescription(
                        selectedRequest
                      )}
                    </div>

                  </div>

                </div>


                <div className="mt-4">

                  <h6 className="fw-bold">
                    Created
                  </h6>

                  <p className="text-muted">
                    {GetCreatedDate(
                      selectedRequest
                    )}
                  </p>

                </div>

              </div>


              {/* MODAL FOOTER */}

              <div className="modal-footer">

                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setSelectedRequest(null)
                  }
                >
                  Close
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
// INFO ITEM
// ============================================================

function InfoItem({
  label,
  value,
  icon
}) {

  return (

    <div className="col-md-6">

      <div
        className="rounded-3 p-3 h-100"
        style={{
          background: "#ffffff",
          border:
            "1px solid #e5e7eb"
        }}
      >

        <div className="d-flex gap-2">

          <span>
            {icon}
          </span>

          <div>

            <div className="small text-muted">
              {label}
            </div>

            <div
              className="fw-semibold"
              style={{
                wordBreak:
                  "break-word"
              }}
            >
              {value}
            </div>

          </div>

        </div>

      </div>

    </div>

  )
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status
}) {

  let className =
    "badge rounded-pill px-3 py-2"


  if (status === "NEW") {

    className +=
      " bg-warning text-dark"

  } else if (
    status === "ASSIGNED"
  ) {

    className +=
      " bg-primary"

  } else if (
    status === "IN_PROGRESS"
  ) {

    className +=
      " bg-info text-dark"

  } else if (
    status === "RESOLVED"
  ) {

    className +=
      " bg-success"

  } else if (
    status === "CONFIRMED"
  ) {

    className +=
      " bg-success"

  } else if (
    status === "CLOSED"
  ) {

    className +=
      " bg-secondary"

  } else {

    className +=
      " bg-dark"

  }


  const displayStatus =
    status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )


  return (

    <span className={className}>

      {displayStatus}

    </span>

  )
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  icon
}) {

  return (

    <div className="col-6 col-lg-3">

      <div className="bg-light rounded-4 p-3 h-100">

        <div className="d-flex justify-content-between">

          <div>

            <small className="text-muted">
              {title}
            </small>

            <h3 className="fw-bold mb-0">
              {Number(value) || 0}
            </h3>

          </div>


          <span className="fs-3">
            {icon}
          </span>

        </div>

      </div>

    </div>

  )
}


// ============================================================
// STATUS CARD
// ============================================================

function StatusCard({
  title,
  value
}) {

  return (

    <div className="col-6 col-md">

      <div className="border rounded-4 p-3 h-100">

        <small className="text-muted">
          {title}
        </small>

        <div className="fs-4 fw-bold">
          {Number(value) || 0}
        </div>

      </div>

    </div>

  )
}