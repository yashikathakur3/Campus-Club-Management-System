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
{ "success": true, "data": { "user": {}, "memberships": [{ "club": { "_id": "...", "name": "Robotics", "slug": "robotics", "logoUrl": "..." }, "clubRole": "member", "status": "active", "canAnnounce": false }] } }
```

Memberships with rejected status are omitted. Errors: 401 `UNAUTHENTICATED`; 403 `ACCOUNT_DISABLED`.

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

### `PATCH /api/v1/auth/me/password`

Requires a valid access token. Request: `{ "currentPassword": "CampusPass123", "newPassword": "NewCampusPass456" }`. On success, increments `tokenVersion` to invalidate previous tokens and returns HTTP 200 with `{ "success": true, "data": { "user": {}, "token": "<new access token>" } }`.

Errors: 400 `VALIDATION_ERROR` or `INVALID_CURRENT_PASSWORD`; 401 `UNAUTHENTICATED`; 403 `ACCOUNT_DISABLED`.

## Super Admin provisioning

There is no public Super Admin registration endpoint. Set `SEED_ADMIN_EMAIL` and a strong `SEED_ADMIN_PASSWORD` in the local backend environment, then run `npm run seed:admin` from `backend`. The seed password must be at least 16 characters and include a letter, number, and symbol. The command is idempotent and never prints the password. If the configured email belongs to a regular member, the script refuses to change that account's role.

## Clubs and memberships

Club categories are `technical`, `cultural`, `sports`, `academic`, `social_service`, `arts`, and `other`. Club membership roles are `member`, `coordinator`, and `president`; statuses are `pending`, `active`, `rejected`, `left`, and `removed`. A club has one active president membership. Membership uniqueness is enforced by a unique `{club,user}` index, including when a prior membership has left or been rejected; re-requests reuse that record.

### `GET /api/v1/clubs`

Public. Query: `q`, `category`, `page` (default 1), `limit` (default 12, max 50), `sort` (`name | createdAt | memberCount`), `order` (`asc | desc`), and `includeInactive=true` (honored only for a super admin). Returns active clubs by default with pagination metadata.

### `GET /api/v1/clubs/:id`

Public; `:id` accepts the MongoDB id or slug. Returns `{ club, president, coordinators, membersPreview?, myMembership }`. Member profiles in `membersPreview` are included only for active club members or super admins. Guests see the count and leadership only. Invalid id/slug syntax returns 400; a valid but unknown id/slug returns 404.

### `POST /api/v1/clubs`

Super admin only. Required body: `{ name, category, presidentUserId }`. Optional fields: `description`, `logoUrl`, `bannerUrl`, `contactEmail`, `socialLinks` (`website`, `instagram`, `facebook`, `linkedin`), and `joinPolicy` (`open | approval`, default `approval`). Creates the club and an active president membership. `presidentUserId` must identify an active user. Duplicate case-insensitive club names return 409.

### `PATCH /api/v1/clubs/:id`

Requires the club's active president or a super admin. Strict editable fields: `name`, `description`, `category`, `logoUrl`, `bannerUrl`, `contactEmail`, `socialLinks`, and `joinPolicy`. Unknown fields return 400.

### `PATCH /api/v1/clubs/:id/status`

Super admin only. Body `{ "isActive": boolean }`. Deactivation hides the club from the public directory and prevents joining; existing membership rows remain intact.

### `POST /api/v1/clubs/:id/transfer-presidency`

Requires the club's active president or a super admin. Body `{ "userId": "..." }`; the target must be an active member or coordinator. The former president becomes a coordinator.

### `POST /api/v1/clubs/:id/join`

Requires authentication. Optional body `{ "message": "..." }`. Open clubs create/reactivate an active membership; approval clubs create/reactivate a pending membership. Duplicate active or pending attempts return 409 (`ALREADY_MEMBER` or `ALREADY_PENDING`). Inactive clubs return 409 `CLUB_INACTIVE`.

### `POST /api/v1/clubs/:id/leave`

Requires authentication. Active members become `left`; a pending request can also be withdrawn. Active member count is decremented once. Presidents receive 409 `PRESIDENT_CANNOT_LEAVE` until transferring the presidency.

### `GET /api/v1/clubs/:id/members`

Requires an active club membership or super admin. Accepts `page`, `limit` (max 50), and `status=active|pending`. Pending requests are visible only to the club president or a super admin. Deactivated users are filtered from both lists.

### `PATCH /api/v1/clubs/:id/members/:userId`

Requires the club's active president or a super admin. Strict body accepts `status=active|rejected|removed`, `clubRole=member|coordinator`, and/or `canAnnounce` boolean. Only pending memberships can be approved/rejected; only active non-president memberships can be removed or updated. An inactive user cannot be approved. The president membership cannot be changed here.

### `GET /api/v1/me/memberships`

Requires authentication. Returns the current user's pending and active memberships with the club summary, `clubRole`, `status`, and `canAnnounce`.
