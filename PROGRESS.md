# Progress Log

## Phase 1 — Project foundation

**Changed**
- Initialized git repository.
- Created `server/` Express backend with MVC-style directory structure
  (`config`, `controllers`, `routes`, `middleware`, plus empty `models`,
  `services`, `validators`, `utils` for later phases).
- Added `GET /api/health` endpoint that reports server status and MongoDB
  connection state.
- Added CORS (allows local frontend at `http://localhost:5173`), JSON body
  parsing, 404 handler, and central error-handling middleware.
- Added MongoDB connection via Mongoose, fail-fast startup, graceful
  shutdown on SIGINT/SIGTERM.
- Created `server/.env.example` and `client/.env.example` (variable names
  only — no secrets).
- Created `client/` React/Vite app (JavaScript template), trimmed demo
  boilerplate to a minimal app shell.

**Verified**
- `npm run dev` (server) starts, connects to MongoDB, serves
  `GET /api/health` → 200 `{ status: "ok", database: "connected" }`
  (API runs on port 5001 — 5000 is taken by macOS AirPlay Receiver).
- `npm run build` (client) completes with exit code 0.
- `npm run dev` (client) starts and serves the app at `http://localhost:5173`.

**Remains**
- Phase 2: Mongoose models (User, Product, Cart, Order).

## Phase 2 — Authentication (register, login, logout)

**Changed**
- Added User model (`name`, `email` unique, `passwordHash` select:false,
  `role` default `customer`, timestamps) + JWT_SECRET fail-fast startup
  guard (`server/src/config/env.js`).
- Added auth API under `/api/auth`: `POST /register` (201/400/409),
  `POST /login` (200/400/401), `POST /logout`, `GET /me` (requireAuth).
- JWT in HttpOnly SameSite=Lax cookie; bcrypt (bcryptjs, cost 10) hashing;
  CORS updated with `credentials: true`.
- Added client auth: `AuthContext` (session restore via `/me`),
  `ProtectedRoute`, `/login`, `/register`, `/` home with logout, React
  Router wiring.

**Verified (automated)**
- Both dev servers started headlessly (server on `:5001`, client on
  `:5173`) and health-checked before testing.
- curl end-to-end with a fresh timestamped user: register → 201 + cookie,
  `/me` with cookie → 200 `{user}` with `id/name/email/role` and no
  `passwordHash`, logout → 200 + cookie cleared (`Expires` in the past),
  `/me` after logout → 401.
- Cookie attributes verified via `curl -sv` on a fresh register: `Set-Cookie`
  contains `HttpOnly` and `SameSite=Lax`, no `Secure` flag (dev mode).
- Client serves the Vite HTML shell at `http://localhost:5173/` (SPA —
  confirms the app boots; interactive UI is not exercised by curl).

**Manual browser verification (run before Phase 3):**
- [ ] Visit `/` while logged out → redirected to `/login`.
- [ ] Register a new user → lands on `/` showing name, email, role `customer`.
- [ ] Reload the page while logged in → still on `/` (session restored via
  `/me` + cookie).
- [ ] Click "Log out" → lands on `/login`.

**Remains**
- Phase 3: Product model + catalog endpoints.