# User Avatar — Cloudinary Upload Design

Date: 2026-09-23
Status: Approved (section-by-section review completed)

## Goal

Let users store a profile picture ("avatar") on the server via Cloudinary,
delivered end-to-end: a multipart upload endpoint on the Express server and
an upload/display UI on the React profile page. One image per user. The
profile page shows the stored image and falls back to the existing initials
circle when none is set.

## Decisions (locked during brainstorming)

1. **Scope:** User avatars only (product/catalog images deferred to the
   catalog phase). Full flow — server endpoint **and** client UI.
2. **Approach: Option A** — a dedicated multipart endpoint
   `POST /api/auth/me/avatar` using `multer` (memory storage) feeding the
   Cloudinary SDK. Existing JSON endpoints and the default 100 KB
   `express.json()` limit are untouched; multipart bypasses the JSON parser
   entirely (no body-limit bump needed).
3. **Image lifecycle:** on re-upload the previous Cloudinary asset is
   destroyed (`uploader.destroy` via stored `avatarPublicId`) — no orphan
   accumulation.
4. **Config:** fail-fast boot validation of the three `CLOUDINARY_*` env
   vars (missing → server refuses to start), matching the existing
   `JWT_SECRET` pattern in `server/src/config/env.js`.
5. **Validation:** hand-rolled checks (multer file filter + explicit
   type/size rules) in the existing style — no validator framework.
6. **Error shape:** existing `{ message }` / `{ errors }` conventions;
   errors flow through the central `errorHandler`.

## New dependencies

- Server: `cloudinary`, `multer` (pinned exact versions)
- Client: none (uses `fetch` + `FormData` already available)

## Server design

### User model — `server/src/models/user.model.js` (edit)

| Field | Rules |
|---|---|
| `avatarUrl` | String, default `null` — public Cloudinary URL returned to the client |
| `avatarPublicId` | String, default `null` — Cloudinary asset id kept server-side for deletion; never returned to the client |

`sanitizeUser` (`server/src/services/auth.service.js`) gains `avatarUrl`
(public id stays private).

### Multer — `server/src/middleware/upload.middleware.js` (new)

- `multer({ storage: memoryStorage(), limits: { fileSize: 5MB } })`
- `fileFilter`: accept only `image/jpeg`, `image/png`, `image/webp`.
  Reject others with `multer.MulterError`-style 400 error (message:
  "Only JPG, PNG, or WebP images are allowed").
- Exported as route-level middleware on the new endpoint: `single("avatar")`
  (field name locked to `avatar` on both sides). Memory storage means no
  temp files on disk.

### Route — `server/src/routes/auth.routes.js` (edit)

- `POST /me/avatar` → `requireAuth`, multer middleware,
  `uploadAvatarHandler`.
- An error mapping helper converts multer errors:
  `LIMIT_FILE_SIZE` → 400 "File too large (max 5 MB)", unknown → 400.

### Service — `server/src/services/cloudinary.service.js` (new)

- Initializes the Cloudinary SDK from `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `uploadAvatar(buffer, mimeType)` → builds `data:<mimeType>;base64,<buffer>`
  from the multer buffer and passes it to `cloudinary.uploader.upload` with
  `{ folder: "avatars", resource_type: "image", overwrite: false }`
  (data URI is the supported input form; no local file needed).
  Returns `{ url, publicId }`.
- `deleteAvatar(publicId)` → `cloudinary.uploader.destroy(publicId)`.
  Swallow "not found" (already gone) errors; propagate other failures.

### Controller — `server/src/controllers/auth.controller.js` (edit)

`uploadAvatarHandler(req, res, next)`:

1. `if (!req.file)` → 400 "No image provided".
2. Upload via `cloudinary.service.uploadAvatar`.
3. Load user (`req.user.id`); if `user.avatarPublicId` is set, call
   `deleteAvatar(old)` (best-effort, deletion failure does not fail the
   request — the new image is already live).
4. Set `user.avatarUrl` / `user.avatarPublicId`, `save()`.
5. Respond `200 { user: sanitizeUser(user) }`.

Cloudinary upload failures map to 502 "Image upload failed" via `next(err)`.

### Env validation — `server/src/config/env.js` (edit)

- Fail-fast: throw if any of `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET` is missing or empty. (Locked in Decisions #4.)

## Client design

### `client/src/api/client.js` (edit)

- `request()` currently always sets `Content-Type: application/json`.
  Change: default to JSON only when the caller did not supply their own
  `Content-Type` header. (A `FormData` body must not carry a JSON content
  type — fetch sets the multipart boundary itself.)
- New `authApi.updateAvatar(formData)` →
  `POST /auth/me/avatar` with `method: "POST"` and `body: formData`
  (no manual Content-Type); cookie via existing `credentials: "include"`.

### `client/src/context/AuthContext.jsx` (edit)

- New `uploadAvatar(file)` callback: builds `FormData` with
  `field: "avatar"`, calls `authApi.updateAvatar`, sets `user` from the
  response, returns the user (so callers can also toast). Reuses existing
  `notify` for success/failure messages.

### `client/src/pages/ProfilePage.jsx` (edit)

- Avatar display: render `<img className="profile-avatar" src={avatarUrl}>`
  when `user.avatarUrl` is set; otherwise the existing initials circle.
- "Change photo" control next to the avatar, visible in view mode (not the
  edit form — avatars are independent of name/email editing):
  1. File picker (`accept="image/jpeg,image/png,image/webp"`).
  2. Client-side checks: type in whitelist, size ≤ 5 MB — instant toast on
     violation, no server round-trip.
  3. Local preview via `URL.createObjectURL` / `FileReader`.
  4. "Upload" button → `uploadAvatar` → toast on success/failure, updated
     avatar swaps in via `user` refresh.
- `getInitials` stays as the fallback.

## Verification

Automated (headless):

- Both dev servers start (API on `:5001`, client on `:5173`) and health
  check passes before tests.
- curl E2E with real Cloudinary credentials (from `server/.env`):
  - register fresh user → cookie.
  - `POST /me/avatar` with `curl -F "avatar=@test.jpg;type=image/jpeg"` →
    200 `{ user }` with `avatarUrl`.
  - `GET /me` → same `avatarUrl`.
  - Re-upload a second image → 200, `avatarUrl`/**publicId** change, old
    asset destroyed (checked via Cloudinary folder listing / dashboard).
  - No file → 400 "No image provided".
  - `avatar=@script.sh` non-image type → 400.
  - > 5 MB file → 400 "File too large".
  - No cookie → 401.
- Client `npm run build` exits 0.

Manual browser pass (documented in `PROGRESS.md`):

- View profile → initials, or image if set.
- Upload via "Change photo", preview, confirm → toast, image swaps in,
  persists across reload.
- Reload while logged in → session restored, image still shown.

## Out of scope

- Product/catalog images (catalog phase).
- Deleting an avatar without replacing it (no endpoint; a placeholder/no
  image cannot be restored once replaced — acceptable, re-upload always
  available).
- Image transforms beyond Cloudinary defaults (no cropping/resizing).