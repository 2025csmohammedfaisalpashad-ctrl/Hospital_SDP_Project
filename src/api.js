// ============================================================
// API CONNECTION
// ============================================================
// Talks to the FastAPI backend running on localhost:8000.
// JWT token is automatically attached to protected requests.
// ============================================================

const BASE_URL = "http://localhost:8000"


// ============================================================
// AUTH HEADERS
// ============================================================

function authHeaders() {

  const token = localStorage.getItem("token")

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}


// ============================================================
// HANDLE UNAUTHORIZED
// ============================================================

function handleUnauthorized(res) {

  if (res.status === 401) {

    localStorage.clear()

    window.location.href = "/login"

  }
}


// ============================================================
// EXTRACT ERROR MESSAGE
// ============================================================
// FastAPI can return errors in different formats:
//
// 1. String:
//    { detail: "Username already exists" }
//
// 2. Validation errors:
//    { detail: [ { msg: "Field required", ... } ] }
//
// 3. Object:
//    { detail: { message: "Something went wrong" } }
//
// This function converts all of them into a readable string.
// ============================================================

function getErrorMessage(data, fallback) {

  // ----------------------------------------------------------
  // No response data
  // ----------------------------------------------------------

  if (!data) {
    return fallback
  }


  const detail = data.detail


  // ----------------------------------------------------------
  // Normal string error
  // ----------------------------------------------------------

  if (typeof detail === "string") {

    return detail

  }


  // ----------------------------------------------------------
  // FastAPI validation errors
  // ----------------------------------------------------------

  if (Array.isArray(detail)) {

    const messages = detail.map((error) => {

      // Error is already a string
      if (typeof error === "string") {
        return error
      }


      // FastAPI normally provides "msg"
      if (error && typeof error.msg === "string") {

        return error.msg

      }


      // Some APIs may use "message"
      if (
        error &&
        typeof error.message === "string"
      ) {

        return error.message

      }


      // Last fallback for an individual error
      try {

        return JSON.stringify(error)

      } catch {

        return "Invalid request"

      }

    })


    return messages.join(", ")

  }


  // ----------------------------------------------------------
  // Object error
  // ----------------------------------------------------------

  if (
    detail &&
    typeof detail === "object"
  ) {

    if (
      typeof detail.message === "string"
    ) {

      return detail.message

    }


    if (
      typeof detail.msg === "string"
    ) {

      return detail.msg

    }


    try {

      return JSON.stringify(detail)

    } catch {

      return fallback

    }

  }


  // ----------------------------------------------------------
  // Alternative "message" property
  // ----------------------------------------------------------

  if (
    typeof data.message === "string"
  ) {

    return data.message

  }


  // ----------------------------------------------------------
  // Final fallback
  // ----------------------------------------------------------

  return fallback
}


// ============================================================
// READ JSON RESPONSE SAFELY
// ============================================================

async function readResponse(res) {

  try {

    return await res.json()

  } catch {

    return null

  }
}


// ============================================================
// GET REQUEST
// ============================================================

export async function apiGet(path) {

  const res = await fetch(
    BASE_URL + path,
    {
      method: "GET",

      headers: {
        ...authHeaders(),
      },
    }
  )


  handleUnauthorized(res)


  const data = await readResponse(res)


  if (!res.ok) {

    throw new Error(
      getErrorMessage(
        data,
        "Something went wrong"
      )
    )

  }


  return data
}


// ============================================================
// POST REQUEST
// ============================================================

export async function apiPost(path, body) {

  const res = await fetch(
    BASE_URL + path,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },

      body: JSON.stringify(body),
    }
  )


  handleUnauthorized(res)


  const data = await readResponse(res)


  if (!res.ok) {

    throw new Error(
      getErrorMessage(
        data,
        "Something went wrong"
      )
    )

  }


  return data
}


// ============================================================
// PUT REQUEST
// ============================================================

export async function apiPut(path, body) {

  const res = await fetch(
    BASE_URL + path,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },

      body: JSON.stringify(body),
    }
  )


  handleUnauthorized(res)


  const data = await readResponse(res)


  if (!res.ok) {

    throw new Error(
      getErrorMessage(
        data,
        "Something went wrong"
      )
    )

  }


  return data
}


// ============================================================
// DELETE REQUEST
// ============================================================

export async function apiDelete(path) {

  const res = await fetch(
    BASE_URL + path,
    {
      method: "DELETE",

      headers: {
        ...authHeaders(),
      },
    }
  )


  handleUnauthorized(res)


  const data = await readResponse(res)


  if (!res.ok) {

    throw new Error(
      getErrorMessage(
        data,
        "Something went wrong"
      )
    )

  }


  return data
}


// ============================================================
// LOGIN
// ============================================================
// Login does NOT attach a token because the user does
// not have a token yet.
// ============================================================

export async function apiLogin(
  username,
  password
) {

  const res = await fetch(
    BASE_URL + "/auth/login",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username: username,
        password: password,
      }),
    }
  )


  const data = await readResponse(res)


  if (!res.ok) {

    throw new Error(
      getErrorMessage(
        data,
        "Invalid username or password"
      )
    )

  }


  return data
}


// ============================================================
// REGISTER
// ============================================================
// Public registration.
// The selected role is sent to the FastAPI backend.
// ============================================================

export async function apiRegister(
  userId,
  name,
  username,
  password,
  role
) {

  const res = await fetch(
    BASE_URL + "/auth/register",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        user_id: userId,
        name: name,
        username: username,
        password: password,
        role: role,
      }),
    }
  )


  const data = await readResponse(res)


  if (!res.ok) {

    throw new Error(
      getErrorMessage(
        data,
        "Registration failed"
      )
    )

  }


  return data
}