# Storage Manager

Storage Manager is a modern, responsive Single Page Application (SPA) for managing storage spaces, boxes, and items. It supports multiple users, sharing, roles (Owner/Editor/Viewer), and invitations. The app is designed to be accessible, keyboard-friendly, and permission-aware.

## Features

- Manage storage spaces, boxes, and items
- User roles: Owner, Editor, Viewer
- Invite collaborators and share access
- QR code creation for labels to boxes
- Image upload & management for spaces and boxes (with lazy loading & caching)
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
- Vitest, React Testing Library, (Playwright optional) for unit & integration tests

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
- Images have descriptive alt text when meaningful; decorative placeholders use empty or generic alt
- Unit, integration, and E2E tests for major flows and role-based UI

## Acceptance Criteria

- Users can create a space, invite another user, and see shared spaces
- Editors can create and move items; Viewers have read-only access
- QR code scanning opens correct link to box and respects permissions
- All pages work on desktop and mobile widths

## Image Handling Architecture

The application now uses a unified `image_id` field (UUID) for both Spaces and Boxes instead of the legacy `thumbnail_url` column (removed from the schema). Images are uploaded to a backend (Azure Function endpoints) and resolved to signed URLs on demand.

### Lifecycle

1. User selects a file in an `ImageUploadField`.
2. The file is uploaded (POST) to `/api/images/{imageId}` returning a temporary `preview_url` (or a blob/object URL fallback if not returned).
3. On entity creation or once an owning entity id exists, a confirmation request (PUT) to `/api/images/{imageId}` attaches metadata (e.g., `space_id` or `box_id`).
4. Display components (cards, details) lazily resolve signed URLs via a batch endpoint `/api/images/urls` using helpers in `src/lib/imageUpload.ts` + `src/lib/imageUrls.ts`.
5. URLs are cached in-memory with in‑flight promise de‑duplication. Space and Box stores also persist a simple map for faster warm loads.

### Clearing / Removing Images

Edit modals (`EditSpaceModal`, `EditBoxModal`) allow removing an existing image. When the user clicks Remove:

- The local form `image_id` is set to an empty string.
- On submit, we transform an empty string into `null` and send that in the patch to Supabase.
- The `useEntityUpdate` hook normalizes a `null` image to `undefined` in local state so UI reverts to placeholder.

### Utilities

- `uploadImage(file, optionalImageId?)` – performs initial upload.
- `confirmImage(imageId, { metadataKey, metadataValue })` – binds uploaded image to an entity.
- `getImageUrls([ids])` – batch maps image ids to signed URLs.
- `resolveImageUrl(id)` – cached single-id resolution (wraps batch call under the hood) with in‑flight coalescing.
- `prefetchImageUrls(ids)` – opportunistic batch prefetch.

### Components

- `ImageUploadField` handles file selection, upload progress state, preview (server preview URL or local object URL), and clearing.
- `SpaceCard` & `BoxCard` both leverage the shared resolver logic for lazy loading on intersection.

### Error Handling

- Upload failures throw and are surfaced in form UI.
- Missing or deleted images resolve to placeholders (no hard failures).
- Batch endpoint returning `null` for an id simply omits it from the resulting URL map.

---

## API Endpoints (Images)

| Method | Path                 | Purpose                                | Body                                 | Response (200)                          |
|--------|----------------------|----------------------------------------|--------------------------------------|-----------------------------------------|
| POST   | `/api/images/{id}`   | Upload raw image bytes (multipart)     | `FormData` with file                 | `{ image_id, preview_url? }`            |
| PUT    | `/api/images/{id}`   | Confirm & attach metadata (entity id)  | JSON `{ key, value }` or similar     | `{ message: "ok" }`                     |
| POST   | `/api/images/urls`   | Batch resolve signed URLs              | JSON array of image ids `["id"]`     | `{ id: { key, value } | null, ... }`    |

Note: The batch resolver accepts an array and returns a map. Missing entries may be present as `null`. The frontend normalizes to `{ [id]: string }` omitting nulls.

---

## Supabase Types

```
npm i supabase@">=2.34.3" --save-dev
npx supabase login
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > .\src\types\database.types.ts
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

---


## Migration Notes

Legacy `thumbnail_url` fields were removed. Ensure any downstream tooling or scripts no longer depend on them. Database migrations introduced `image_id` columns, and frontend types & schemas were updated accordingly.

---

## Testing Strategy (Images)

- Unit tests cover upload helper, URL resolution caching, in‑flight dedupe, and missing URL behavior.
- Integration tests simulate full upload + confirm + batch mapping flows via fetch mocking.
- Separate tests verify clearing images sends `image_id: null`.

Run all tests:

```bash
npm test
```

---

## Future Enhancements

- Alt text customization per image
- Expiring URL refresh (currently relies on session cache lifespan)
- Drag & drop multi-image support
- Progressive image preview (blur-up)

