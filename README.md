# Storage Manager

Storage Manager is a modern, responsive Single Page Application (SPA) for managing storage spaces, boxes, and items. It supports multiple users, sharing, roles (Owner/Editor/Viewer), and invitations. The app is designed to be accessible, keyboard-friendly, and permission-aware.

## Features

- Manage storage spaces, boxes, and items
- User roles: Owner, Editor, Viewer
- Invite collaborators and share access
- QR code creation for labels to boxes
- Bulk operations: move, delete, export, tag
- Accessible UI (WCAG AA)
- Mobile-first design

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS & shadcn/ui
- Zustand (state management)
- React Router
- React Hook Form + Zod (forms & validation)
- Supabase Auth (social login)
- Jest, React Testing Library, Playwright (testing)

## Main Pages & Routes

- `/` — Dashboard (stats, recent activity, quick access)
- `/spaces` — List of storage spaces
- `/spaces/new` — Create storage space wizard
- `/spaces/:spaceId` — Storage space detail
- `/spaces/:spaceId/boxes/new` — Create box
- `/spaces/:spaceId/boxes/:boxId` — Box detail
- `/spaces/:spaceId/boxes/:boxId/items/new` — Add item
- `/items/:itemId` — Item detail
- `/profile` — User profile, invites, connected accounts
- `/auth/*` — Login / register / forgot password / accept invite

## Accessibility & Testing

- All interactive elements are keyboard-focusable and have proper aria-labels
- Color contrast meets WCAG AA
- Images have alt text; forms have labels
- Unit, integration, and E2E tests for major flows and role-based UI

## Acceptance Criteria

- Users can create a space, invite another user, and see shared spaces
- Editors can create and move items; Viewers have read-only access
- QR code scanning opens correct link to box and respects permissions
- All pages work on desktop and mobile widths

## Supabase Types

```
npm i supabase@">=2.34.3" --save-dev
npx supabase login
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > database.types.ts
```
