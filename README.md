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

## Environment Variables (Supabase Connection)

To connect the app to your Supabase project, you need to create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these values in your Supabase dashboard:

- Go to your project in Supabase
- Click on the **Connect** view (usually in the sidebar)
- Copy the **Project URL** and **anon public key**
- Paste them into your `.env` file as shown above

These variables are required for the app to connect to Supabase for authentication and data access. Never commit your real `.env` file to a public repository.

## Hosting

Currently this is designed to be hosted in Azure using Azure Static Web Apps (Free sku) and a Storage Account.

## SWA

```bash
# Start dev for frontend
npm run dev

# Start Azure Static Web App simulator
swa start http://localhost:5173 --api-location api
```
