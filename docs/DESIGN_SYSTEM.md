# Campus Club design system

The interface uses a calm, high-contrast foundation with indigo as its primary action color, navy for the app shell and hero, and amber for occasional emphasis. Pages use a slate-50 canvas, white surfaces, and slate-200 borders. Inter is the shared typeface.

## Tokens

| Purpose | Token | Use |
| --- | --- | --- |
| Primary | `brand` / `brand-dark` / `brand-soft` | Primary actions, links, focus rings |
| App shell and hero | `navy`, `navy-deep`, `navy-muted` | Sidebar, hero backgrounds |
| Accent | `accent` | Small highlights and illustration details |
| Status | `success`, `warning`, `danger`, `info` | Positive, caution, error, and informational states |
| Page and border | `page`, `border`, Tailwind `slate-*` | Backgrounds, dividers, text hierarchy |

Cards use `rounded-card` (12px) and a restrained card shadow. Form controls and buttons use `rounded-control` (8px). Shadows stay subtle; elevated menus and modals may use `shadow-lg`. Interactive elements use 150–200ms transitions and visible keyboard focus rings. A global reduced-motion rule removes animation and transition movement when the user requests it.

## Shared UI components

All components are in `frontend/src/components/ui` and accept normal class composition where appropriate.

- `Button`: primary, secondary, ghost, and danger variants; small, medium, and large sizes; loading state disables the control and sets `aria-busy`.
- `Input`, `Select`, `Textarea`: labelled fields with optional hints, error text, `aria-invalid`, and linked `aria-describedby` IDs.
- `Badge`: neutral, primary, success, warning, danger, and info status treatments.
- `Card`: bordered white content surface with configurable padding.
- `Modal`: labelled modal dialog, Escape and backdrop close, focus restoration, and a lightweight Tab focus trap. `ConfirmDialog` adds cancel and confirm actions.
- `Skeleton`: decorative loading block hidden from assistive technology.
- `EmptyState`: icon, title, description, and optional action for genuinely empty product areas.
- `Pagination`: labelled previous/next controls with disabled boundaries.
- `Tabs`: keyboard navigable tab list and associated panel.
- `Avatar`: image with an initials fallback.
- `StatCard`: compact label/value/caption surface with optional icon.
- `PageHeader`: consistent page title, description, eyebrow, and optional action.
- `SearchInput`: labelled search field that emits trimmed input after a 300ms debounce using `hooks/useDebounce`.

## Phase 4 account pages

The Profile page uses the shared `Tabs`, `Input`, `Select`, `Textarea`, `Avatar`, and `Badge` components for profile editing and password security. The admin Users page uses responsive desktop tables and mobile cards, shared search/filter/pagination components, status and role badges, skeletons, an empty state, and `ConfirmDialog` before role or account status changes. Only super admins see the Users navigation item; the admin route also enforces the role at the router boundary.

## Phase 5 club pages

The public Clubs directory uses a compact hero, category chips, debounced search, sorting, responsive ClubCards, and shared loading, empty, error, and pagination patterns. Club detail pages show leadership to visitors and member previews only to members. Club forms and management reuse the shared controls, tabs, badges, avatars, and confirmation dialogs. The app sidebar links to Clubs and My Clubs; club creation is visible only to super admins.

## Phase 6 event pages

The public Events directory uses debounced search, category/club/date filters, upcoming/past and availability filters, responsive event cards, capacity meters, skeletons, pagination, and explicit empty/error states. Event detail pages show timezone-aware dates, club links, capacity, and the registration state. Event registration changes are followed by a server refetch; unregister uses `ConfirmDialog`. Event forms use shared inputs and confirmation dialogs for publish/cancel. Attendee and My Events views use shared avatar, search, tab, pagination, loading, and empty-state components.

## Accessibility

Use semantic headings and navigation landmarks, visible focus indicators, explicit form labels, accessible names for icon-only controls, and reduced-motion-safe transitions. Sidebar navigation collapses into a dismissible mobile drawer. Notifications are intentionally disabled until Phase 8 wires the real notification center; no unread count is fabricated.
