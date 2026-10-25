# API conventions

All endpoints are under `/api/v1` and use JSON.

## Success envelope

```json
{ "success": true, "data": {}, "meta": {} }
```

`meta` is optional. A success response without metadata is `{ "success": true, "data": ... }`.

## Error envelope

```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Readable message", "details": [] } }
```

`details` is optional and carries validation or field information. Validation errors use HTTP 400, authentication errors 401, disabled accounts 403, conflicts 409, and rate limits 429.

## Health

`GET /api/v1/health` is public and returns HTTP 200:

```json
{ "success": true, "data": { "status": "ok", "db": "connected", "uptime": 1.23, "environment": "development" } }
```

The `db` value is `connected` or `disconnected`; uptime is a number of seconds.

## Authentication

Access tokens are sent as `Authorization: Bearer <token>`. Successful auth responses contain a `user` and `token`; user JSON never contains `passwordHash` or `tokenVersion`. Login and registration are rate limited to 10 attempts per IP per 15 minutes (the stricter limit is disabled during tests). Registration always creates a `member`; its strict request schema rejects unknown properties such as `role`.

### `POST /api/v1/auth/register`

Public. Creates a member account.

Request:

```json
{ "name": "A Student", "email": "student@example.edu", "password": "CampusPass123", "studentId": "S123", "department": "Computing" }
```

`studentId` and `department` are optional. Passwords require at least 8 characters, one letter, and one number. Returns HTTP 201:

```json
{ "success": true, "data": { "user": { "_id": "...", "name": "A Student", "email": "student@example.edu", "role": "member" }, "token": "<access token>" } }
```

Errors: 400 `VALIDATION_ERROR` for invalid or unknown fields; 409 `CONFLICT` for a duplicate email or student ID; 429 `RATE_LIMITED`.

### `POST /api/v1/auth/login`

Public. Request: `{ "email": "student@example.edu", "password": "CampusPass123" }`. Returns HTTP 200 with `{ "success": true, "data": { "user": {}, "token": "<access token>" } }`.

Errors: 400 `VALIDATION_ERROR`; 401 `UNAUTHENTICATED` with the same message for an unknown email or incorrect password; 403 `ACCOUNT_DISABLED`; 429 `RATE_LIMITED`.

### `GET /api/v1/auth/me`

Requires a valid access token. Returns HTTP 200:

```json
{ "success": true, "data": { "user": {}, "memberships": [] } }
```

`memberships` is intentionally empty until the club membership phase. Errors: 401 `UNAUTHENTICATED`; 403 `ACCOUNT_DISABLED`.

### `PATCH /api/v1/auth/me`

Requires a valid access token. Accepts one or more of `name`, `department`, `year`, `bio`, `avatarUrl`, and `studentId`. The schema is strict; `role`, `isActive`, `email`, and all other properties are rejected. Returns HTTP 200: `{ "success": true, "data": { "user": {} } }`.

Errors: 400 `VALIDATION_ERROR`; 401 `UNAUTHENTICATED`; 403 `ACCOUNT_DISABLED`; 409 `CONFLICT` for duplicate student ID.

## Users (super admin only)

All `/users` routes require a valid access token belonging to an active `super_admin`. Missing/invalid tokens return 401; other authenticated roles receive 403. User responses omit `passwordHash` and `tokenVersion`.

### `GET /api/v1/users`

Query parameters: `page` (default 1), `limit` (default 20, maximum 50), `q` (case-insensitive literal search across name, email, and student ID), `role` (`super_admin | member`), `isActive` (`true | false`), `sort` (`createdAt | name | email`, default `createdAt`), and `order` (`asc | desc`, default `desc`). Returns a user array with pagination metadata: `{ "success": true, "data": [], "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 } }`.

### `GET /api/v1/users/:id`

Returns `{ "success": true, "data": { "user": {} } }`. Invalid MongoDB IDs return 400; missing users return 404.

### `PATCH /api/v1/users/:id`

Strict JSON body accepts one or both of `role` (`super_admin | member`) and `isActive` (boolean). Unknown fields and an empty body return 400. Returns `{ "success": true, "data": { "user": {} } }`. A super admin cannot change their own role or deactivate themselves (400 `SELF_MODIFICATION_FORBIDDEN`). The last active super admin cannot be demoted or deactivated (409 `LAST_SUPER_ADMIN`). Every actual role or active-state change increments `tokenVersion`, invalidating that user's existing access tokens. Missing users return 404.

Club role checks are exposed by `services/clubAccessService.js`. Its `getMembership(userId, clubId)` placeholder deliberately returns no membership until Phase 5 creates `ClubMembership`; `assertClubRole` already grants super admins access and rejects other users until that membership implementation exists.

### `PATCH /api/v1/auth/me/password`

Requires a valid access token. Request: `{ "currentPassword": "CampusPass123", "newPassword": "NewCampusPass456" }`. On success, increments `tokenVersion` to invalidate previous tokens and returns HTTP 200 with `{ "success": true, "data": { "user": {}, "token": "<new access token>" } }`.

Errors: 400 `VALIDATION_ERROR` or `INVALID_CURRENT_PASSWORD`; 401 `UNAUTHENTICATED`; 403 `ACCOUNT_DISABLED`.

## Super Admin provisioning

There is no public Super Admin registration endpoint. Set `SEED_ADMIN_EMAIL` and a strong `SEED_ADMIN_PASSWORD` in the local backend environment, then run `npm run seed:admin` from `backend`. The seed password must be at least 16 characters and include a letter, number, and symbol. The command is idempotent and never prints the password. If the configured email belongs to a regular member, the script refuses to change that account's role.
