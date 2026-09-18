# Auth Phase Design — Registration, Login, Logout

Date: 2025-09-18
Status: Approved (section-by-section review completed)

## Goal

Add authentication to the e-commerce platform: user registration, login,
logout, and session restore. Delivered end-to-end — Express REST API plus
React client pages — so users can create an account, sign in, and sign out.

## Decisions (locked during brainstorming)

1. **Token transport:** JWT delivered in an `HttpOnly` cookie. The token
   never touches JavaScript. Logout is a real server endpoint that clears
   the cookie. (`SameSite=Lax` covers the primary CSRF vector; no CSRF token
   ceremony this phase.)
2. **Scope:** Server API **and** client UI (B).
3. **User model:** `name`, `email`, `passwordHash`, `role` with
   `role` defaulting to `"customer"` (B).
4. **Client architecture:** React Router + `AuthContext` (A) —
   `react-router-dom` added (README already plans it).
5. **Password hashing:** bcrypt via `bcryptjs` (pure-JS implementation of
   the bcrypt algorithm, satisfies README's "JWT + bcrypt" intent, no
   native compile step). Cost factor 10.
6. **Validation:** hand-rolled validators, no validator dependency.
7. **Verification:** curl-based end-to-end checks documented in
   `PROGRESS.md`; no test framework added this phase.

## New dependencies

- Server: `jsonwebtoken`, `bcryptjs`, `cookie-parser` (runtime)
- Client: `react-router-dom`

## Server design

### User model — `server/src/models/user.model.js` (new)

| Field | Rules |
|---|---|
| `name` | String, required, trimmed, 2–60 chars |
| `email` | String, required, lowercase + trimmed, unique index, simple format regex |
| `passwordHash` | String, required, `select: false` (never returned by default queries) |
| `role` | enum `["customer", "admin"]`, default `"customer"` |
| timestamps | `createdAt`, `updatedAt` via `timestamps: true` |

Email uniqueness is enforced by the DB unique index; the auth service maps
the duplicate-key error (`E11000`) to HTTP 409 (no check-then-insert race).

### Validation — `server/src/validators/auth.validator.js` (new)

- `validateRegister({ name, email, password })` and
  `validateLogin({ email, password })`.
- Rules: email format (regex) · password min length 8 · name present for
  register.
- Return shape: array of `{ field, message }`. Non-empty array → 400 with
  that list. Same shape for both endpoints.

### Service layer — `server/src/services/auth.service.js` (new)

`register`, `login`, `logout`, `getCurrentUser` + JWT sign/verify helpers.
Controllers stay thin (translations of service results → HTTP status).

### Endpoints — `server/src/controllers/auth.controller.js` + `server/src/routes/auth.routes.js` (new), mounted at `/api/auth`

| Endpoint | Body | Success | Behavior |
|---|---|---|---|
| `POST /register` | `{name, email, password}` | 201 `{user}` (no hash) | Validate → bcrypt hash (cost 10) → create user → set cookie → return user |
| `POST /login` | `{email, password}` | 200 `{user}` | Validate → find by email (+passwordHash) → `bcrypt.compare` → set cookie → return user |
| `POST /logout` | — | 200 `{ok: true}` | Clear cookie (stateless; nothing else to invalidate) |
| `GET /me` | — | 200 `{user}` | Require cookie → return current user or 401 |

### Cookie contract

Name `token` · JWT payload `{ sub: userId, role }` signed with `JWT_SECRET`
· `HttpOnly` · `SameSite=Lax` · `Secure` when `NODE_ENV === "production"`
· expires per `JWT_EXPIRES_IN` (default `7d`).

### `requireAuth` middleware — `server/src/middleware/auth.middleware.js` (new)

1. Read `token` cookie (cookie-parser).
2. Verify signature + expiry → 401 `{ message: "Not authenticated" }` on
   any failure.
3. Load user from DB by `sub`; user deleted → 401 (revoked immediately).
4. Attach `req.user = { id, email, role }` for downstream handlers.

### Error mapping

400 validation (field list) · 401 bad credentials / missing or invalid
token · 409 duplicate email · 500 fallback (message hidden). Reuses the
existing central `errorHandler`.

### Wiring — `server/src/app.js` (modified)

- `app.use(cookieParser())`
- `app.use("/api/auth", authRoutes)`
- CORS gains `credentials: true`; origin stays the explicit
  `CLIENT_ORIGIN` string (required for the cookie to cross origins).

### Startup guard

Fail fast (mirroring `config/db.js`): server refuses to boot if
`JWT_SECRET` is missing or still the `change-me-to-a-long-random-string`
placeholder. `.env` already has a real secret set.

## Client design

### New files (`client/src/`)

- `api/client.js` — fetch wrapper: base URL from `VITE_API_URL` (default
  `http://localhost:5001`), every request sends `credentials: "include"`,
  JSON parse + uniform error extraction.
- `context/AuthContext.jsx` — `AuthProvider` with
  `{ user, loading, login, register, logout }`. On mount, `useEffect` calls
  `GET /api/auth/me` → user (or null) → `loading = false`. `login` /
  `register` call the API, set user state, rethrow server error messages.
- `pages/LoginPage.jsx` / `pages/RegisterPage.jsx` — 2/3-field forms;
  inline field errors from the 400 `{field, message}` list; banner for
  401/409; disabled submit while pending.
- `components/ProtectedRoute.jsx` — `loading` → null (no flash);
  `!user` → `<Navigate to="/login">`; else children.
- `pages/HomePage.jsx` — logged-in user's name/email/role + logout button.

### Modified (`client/src/`)

- `main.jsx` — wrap in `BrowserRouter` + `AuthProvider`.
- `App.jsx` — routes: `/` (protected → HomePage), `/login`, `/register`;
  unknown → redirect home.

### Flows

- **Logout:** button → `POST /api/auth/logout` (credentials included) →
  clear user state → navigate to `/login`.
- **Session restore:** reload during a session → `/me` on mount returns the
  user from the cookie.

## Verification (curl-based, documented in PROGRESS.md)

1. `npm run dev` boots; startup guard passes with real secret.
2. Register → 201 + cookie; duplicate email → 409; bad payload → 400 with
   field errors.
3. Login → 200 + cookie; wrong password → 401.
4. `/me` with cookie → user; without / tampered cookie → 401.
5. Logout → cookie cleared; `/me` after logout → 401.
6. Email case differences → same user (lowercase normalization).
7. Client: register → lands on home logged in; reload restores session;
   logout → back to `/login`; `/` while logged out → redirects.

## Out of scope (deferred)

- CSRF token ceremony (`SameSite=Lax` covers the main vector)
- Refresh token rotation / blacklist (stateless JWT + cookie clear)
- Email verification / password reset
- Express-validator or zod (validators isolated for a later swap)
- Automated test framework (vitest + supertest) — later phase
- Admin UI / role-based route guards (only basic `role` field now)
- Rate limiting on login