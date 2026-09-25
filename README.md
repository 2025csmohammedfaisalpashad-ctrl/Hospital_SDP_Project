# Hospital Support Request System — Frontend

React (Vite) + Bootstrap + react-router-dom. Login-gated, role-based
dashboards, JWT stored client-side and attached to every API call.

## Run it

```
npm install
npm run dev
```

Opens at http://localhost:5173 — you'll land on the Login page first.

## Before you run it

1. Start the backend first (see backend README — needs its own `.env`
   with `MONGO_URL` set): `uvicorn main:app --reload`
2. Login with one of the demo accounts:

   | Role             | Username | Password     |
   |------------------|----------|--------------|
   | Admin            | admin    | Admin@123    |
   | Team Lead        | teamlead | Teamlead@123 |
   | Support Engineer | engineer | Engineer@123 |
   | Support Engineer | vijay    | Vijay@123    |
   | Department Staff | staff    | Staff@123    |

3. You'll be redirected automatically to the dashboard matching your
   role. Typing another role's URL (e.g. `/admin` while logged in as
   `staff`) bounces you back to `/login`.
4. Logout clears the stored token — the browser back button can't get
   you back into a protected page afterward.

## Structure

```
src/
  api.js                     -> fetch helpers, auto-attach JWT, 401 -> logout
  App.jsx                    -> routes: /login, /staff, /engineer, /teamlead, /admin
  App.css
  auth/
    AuthContext.jsx          -> holds token/role/user in state + localStorage
  pages/
    LoginPage.jsx
  components/
    ProtectedRoute.jsx       -> blocks a route if not logged in / wrong role
    StaffPanel.jsx
    EngineerPanel.jsx
    TeamLeadPanel.jsx
    AdminPanel.jsx
```

Same plain useState + fetch pattern as before — the only new concepts
are `react-router-dom` for the routes and a `useAuth()` hook (React
Context) to read the logged-in user anywhere in the app.