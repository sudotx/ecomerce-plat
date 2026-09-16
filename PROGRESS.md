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