# Project Context

These decisions are fixed for the Campus Club Management Platform:

- Architecture: JavaScript modular monolith.
- Backend layout: `config/`, `middleware/`, `models/`, `routes/`, `services/`, `utils/`, plus `app.js` and `server.js`.
- Roles: `User.role` is `super_admin | member`; `ClubMembership.clubRole` is `member | coordinator | president`.
- Create Super Admin accounts only through a seed script.
- Authentication uses a JWT access token in `Authorization: Bearer`; `tokenVersion` invalidates existing tokens.
- Success responses use `{ success: true, data, meta? }`; errors use `{ success: false, error: { code, message, details? } }`.
- List endpoints use `page`, `limit` (maximum 50), `sort`, and `q` query parameters.
- Store money as integer `amountMinor` in paise (INR).
- Avoid multi-document transactions; use atomic conditional updates and unique indexes.
- Validate request input with Zod.
- QR attendance uses a separate short-lived signed token.
- Notifications are in-app only.
- Only super admins can manage platform users. Actual role/active-state changes increment `tokenVersion`; the last active super admin is protected from demotion or deactivation.
- Club access checks use `services/clubAccessService.js`; its membership lookup remains a documented placeholder until Phase 5 introduces `ClubMembership`.
- Test with Jest, Supertest, and mongodb-memory-server.
- Commit after each phase.
