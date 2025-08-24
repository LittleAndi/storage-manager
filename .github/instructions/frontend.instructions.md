## Overview

This document describes the frontend architecture, UI/UX, components, pages, state management and acceptance criteria for the Storage Manager app. Use it as an instruction set for AI agents or frontend developers to implement a production-ready SPA.

### Goals

- Responsive Single Page Application (SPA) for managing storage spaces, boxes and items.
- Support for multiple users, sharing, roles (Owner/Editor/Viewer) and invitations.
- Accessible, keyboard-friendly UI and clear permission-aware affordances.

### Tech stack recommendation (example)

- Framework: **React + TypeScript** (or Vue3 + TypeScript if preferred)
- Bundler: Vite
- Styling: Tailwind CSS and shadcn/ui components or component library
- State management: Zustand or Redux Toolkit (keep global state minimal)
- Routing: React Router
- Forms: React Hook Form + Zod for validation
- File uploads: direct S3 / signed URLs or backend proxy
- Testing: Jest + React Testing Library, Playwright for E2E

### High-level pages / routes

- `/` — Dashboard (stats, recent activity, quick access)
- `/spaces` — List of storage spaces (owned + shared)
- `/spaces/new` — Create storage space wizard
- `/spaces/:spaceId` — Storage space detail (members, boxes list, map)
- `/spaces/:spaceId/boxes/new` — Create box modal/page
- `/spaces/:spaceId/boxes/:boxId` — Box detail (items list)
- `/spaces/:spaceId/boxes/:boxId/items/new` — Add item
- `/items/:itemId` — Item detail (global route)
- `/profile` — User profile, invites, connected accounts
- `/auth/*` — Login / register / forgot password / accept invite

### Top-level components

- `AppShell` — header, sidebar, responsive layout
- `SpaceCard` — used on `/spaces` and dashboard
- `BoxCard` — grid/list item representing a box
- `ItemRow` / `ItemCard` — per-item component
- `MemberList` — shows members and roles for a space
- `PermissionGuard` — HOC / hook to show/hide UI by permission
- `SearchBar` — global search
- `ActivityFeed` — recent changes for a space

### Component responsibilities & props

Provide lightweight props and keep components presentational when possible. For example `SpaceCard` props:

- `id`, `name`, `location`, `memberCount`, `owner`, `thumbnailUrl`, `onOpen`.

### State management

- Auth: token + user profile persisted (secure cookie or httpOnly cookie recommended)
- Spaces list: cached per-user, invalidated on create/update/delete
- Current space: load detailed data (members, boxes) when opening
- Optimistic updates for common actions (create/edit/delete) with rollback on error

### Permissions logic (frontend)

- Fetch user roles for each space on load. Expose helper hook `useSpacePermission(spaceId)` returning `{ isOwner, canEdit, canView }`.
- Hide or disable actions depending on role. Example: `Viewer` sees export and search but no create/edit buttons.

### Key UX flows

#### Create and share a storage space

1. User clicks `New space`. Wizard collects name, location, optional photo.
2. On success, open `Invite collaborators` modal with permissions dropdown (Editor/Viewer).
3. Send invites (email) via backend; show invite pending state until accepted.

#### Scanning & QR code flow

- `Generate QR` for a box (labels). Currently available from the Space Details for all the boxes.
- Scanning tht QR code will take the user to the box directly since it shall contain the entire URL for the box.

#### Bulk operations

- Multi-select boxes/items, toolbar with `Move`, `Delete`, `Export`, `Tag`.

### Accessibility

- All interactive elements keyboard-focusable and have proper aria-labels.
- Color contrast meets WCAG AA.
- Images have alt text; forms have labels.

### Testing

- Unit tests for components and hooks.
- Integration tests for major flows: create space, invite user, create box, add item, share access, scan QR.
- E2E tests cover role-based UI differences.

### Acceptance criteria

- Users can create a space, invite another user and that user sees the space under `Shared with me`.
- A user with `Editor` role can create and move items; a `Viewer` cannot.
- QR code scanning opens correct box and respects permissions.
- All pages work on desktop and mobile widths.
