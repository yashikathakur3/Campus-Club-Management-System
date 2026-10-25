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

## Events and registrations

Event categories are `workshop`, `competition`, `social`, `meeting`, `talk`, and `other`. Event visibility is `public | members_only`; lifecycle status is `draft | published | cancelled | completed`. Registration status is `registered | cancelled | waitlisted` (waitlisting is reserved and is not currently used). Event capacities are positive integers. `spotsLeft` is `max(0, capacity - registeredCount)`. Public event list reads only return published events; they compute `isPast` without writing. Reading a single elapsed published event lazily marks it completed. This means an event list request has no lifecycle write side effects.

### `GET /api/v1/events`

Public. Query: `q` (case-insensitive literal title/description search), `category`, `clubId`, `when=upcoming|past`, ISO `from` and `to` (filter start date), `available=true|false`, `sort=startsAt`, `order=asc|desc`, `page`, and `limit` (maximum 50). Each event includes `spotsLeft`, `isPast`, and a compact populated club summary. Returns event array and pagination metadata.

### `GET /api/v1/events/:id`

Published, cancelled, and completed event details are readable by everyone so registrants can see lifecycle changes. Drafts are returned only to the club president, a coordinator assigned to that event, or a super admin; others receive 404. The response includes `registeredCount`, `spotsLeft`, `isPast`, compact club details, and authenticated `myRegistration` (or `null`). Elapsed published events are lazily marked completed on this detail read.

### `POST /api/v1/clubs/:clubId/events`

Requires the active club president, an active club coordinator, or a super admin. Body: `title`, `description`, `category`, `startsAt`, `endsAt`, `location`, positive integer `capacity`; optional `registrationDeadline` (defaults to `startsAt` and cannot be later), `posterUrl`, `visibility`, and `coordinators` (active coordinators of this club). `endsAt` must be after `startsAt`. Coordinator-created events are always drafts. President and super-admin created events also begin as drafts. Returns HTTP 201.

### `GET /api/v1/clubs/:clubId/events`

Requires an active president/coordinator or super admin. Includes drafts and other statuses for that club. Query: `page`, `limit` (maximum 50), and optional lifecycle `status`.

### `PATCH /api/v1/events/:id`

Requires the club president, super admin, or the coordinator assigned to that event. Accepts strict event content/date/capacity/visibility/coordinator fields. End must remain after start, deadline cannot follow start, and capacity cannot be set below the current registered count (409 `CAPACITY_BELOW_REGISTERED`). Cancelled and completed events cannot be edited (409 `EVENT_LOCKED`).

### `PATCH /api/v1/events/:id/status`

Requires the club president or super admin. Body `{ "action": "publish" | "cancel" }`. Publishing is allowed only from draft. Cancelling preserves registrations as history and calls the notification service for registered users (delivery remains a Phase 8 stub). Repeated cancellation is idempotent.

### `POST /api/v1/events/:id/register` and `DELETE /api/v1/events/:id/register`

Require authentication. Super admins may register for any event. Registration requires a published, not-ended event whose deadline has not passed; members-only events additionally require an active club membership. Conflicts: 409 `EVENT_NOT_OPEN`, `REGISTRATION_CLOSED`, `EVENT_FULL`, or `ALREADY_REGISTERED`; missing events return 404 and membership-only access returns 403. Seat reservation is an atomic conditional increment and registration uniqueness is enforced by `{event,user}`; failed writes compensate by decrementing the reserved count. Delete conditionally cancels a registration and decrements capacity once. Repeated cancellation returns HTTP 200 with an already-cancelled message and does not decrement again.

### `GET /api/v1/events/:id/registrations`

Requires the club president, super admin, or an assigned event coordinator. Query: `q` (literal name/email/student ID search), `page`, and `limit` (maximum 50). Returns registered attendees and pagination metadata; summary includes registered count, capacity, and spots left.

### `GET /api/v1/me/registrations`

Requires authentication. Query: `status=registered|cancelled|waitlisted`, `when=upcoming|past`, `page`, and `limit` (maximum 50). Returns the current user's event registrations with populated event and club summaries.
