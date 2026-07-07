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

**Frontend**
- React 19 + TypeScript 5.9
- Vite 7
- Tailwind CSS v4 (via `@tailwindcss/vite`) + shadcn/ui + Radix UI primitives
- Zustand (state management)
- React Router v7
- React Hook Form + Zod (schema validation)
- Supabase JS client (`@supabase/supabase-js`) for Auth, Database, Storage
- Sonner (toast notifications)
- Lucide React Icons

**Backend / API**
- Azure Functions (.NET 8 isolated worker)
  - Azure.Storage.Blobs (image storage)
  - SixLabors.ImageSharp (image processing)
  - Application Insights telemetry
- Supabase (Postgres, Auth, Storage policies)

**Tooling & Dev Experience**
- Node.js ≥ 22.12
- TypeScript project refs (`tsconfig.app.json`, `tsconfig.node.json`)
- ESLint 9 + `typescript-eslint` + React Hooks/Refresh plugins
- Vitest + React Testing Library + User Event (unit/integration)
- Playwright (E2E, optional)
- Supabase CLI (type generation)
- Azure Static Web Apps (hosting & CI workflow)

**Other**
- Vite chunk splitting (manualChunks in `vite.config.ts`) for perf
- Image upload + signed URL resolution via custom Azure Function endpoints

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

The application uses a unified `image_id` (UUID) for both Spaces and Boxes. Each image lives as a prefix in Azure Blob Storage containing two blobs: the original upload and a generated thumbnail. Legacy `thumbnail_url` has been removed in favor of this canonical reference.

### Storage Layout

```
<imageId>/original.<ext>
<imageId>/thumbnail.<ext>
```

### Endpoints (Current)

| Method | Path                     | Purpose                                      | Notes |
|--------|--------------------------|----------------------------------------------|-------|
| POST   | `/api/images/{imageId}`  | Upload file (multipart); creates original + thumbnail; returns preview URL (thumbnail SAS) | Sets `status=unconfirmed` metadata |
| PUT    | `/api/images/{imageId}`  | Confirm image & attach ownership metadata    | Body: `{ "metadata_key": "box_id|space_id", "metadata_value": "<uuid>" }` sets `status=confirmed` |
| POST   | `/api/images/urls`       | Batch resolve signed URLs for ids            | Returns map of id -> `{ key, value }` (one blob's latest seen key/value) |
| DELETE | `/api/images/{imageId}`  | Delete all blobs under image prefix          | Used when a box/space is deleted |

### Lifecycle

1. UI generates/chooses an `imageId` (UUID) and uploads file via `uploadImage()`.
2. Backend stores original, generates a 150x150 thumbnail, sets metadata `status=unconfirmed`.
3. When entity (box/space) creation succeeds, client calls `confirmImage()` which:
  - Adds ownership key (`box_id` or `space_id`).
  - Updates `status=confirmed` on both blobs.
4. Display components resolve signed URLs lazily using `resolveImageUrl()` / `prefetchImageUrls()` which call the batch endpoint.
5. Deleting a box or space calls `DELETE /api/images/{imageId}` (fire-and-forget) to remove both blobs.

### Client Utilities

- `uploadImage(file, providedId?)` – handles upload & returns `{ imageId, previewUrl? }`.
- `confirmImage(imageId, { metadataKey, metadataValue })` – sets ownership + confirmed state (safe to retry).
- `getImageUrls(imageIds[])` – batch fetch mapping; front-end normalizes to `Record<imageId,string>`.
- `resolveImageUrl(imageId)` & `prefetchImageUrls(ids)` – in‑memory cached resolution (coalesces requests).

### Caching Strategy

- In-memory map keyed by `imageId` (session scope).
- Concurrent lookups deduplicated via a shared promise.
- Per-entity URL maps (space/box) optionally persisted to `localStorage` for perceived speed on reload.

### Deletion Behavior

- Box or space deletion triggers removal of its referenced image via DELETE endpoint.
- (Current) Removing an image from an entity form sets `image_id` to null in DB but does NOT yet automatically delete the old blobs (a future enhancement could perform replacement cleanup).

### Metadata & Orphan Detection

Metadata keys used:

- `status=unconfirmed|confirmed`
- `box_id=<uuid>` or `space_id=<uuid>` (only one is expected)

Potential orphans:

1. Unconfirmed images older than a grace period (user abandoned form).
2. Images whose owning entity was deleted before confirm (rare; they remain `status=unconfirmed`).
3. Disassociated images (entity `image_id` cleared) – pending automated cleanup.

### Planned Enhancements

- Timer-trigger function to purge `status=unconfirmed` images > 24h.
- Cleanup for images whose `image_id` is no longer referenced in DB.
- Optional migration from metadata to Blob Index Tags for native lifecycle policies.
- Image replacement workflow (delete prior image after successful new confirm).
- AuthN/AuthZ on image endpoints (currently `Anonymous` for prototype convenience).

### Error Handling

- Upload errors surface via thrown `ImageUploadError` (frontend shows message).
- Failed confirm attempts are safe to retry (idempotent metadata merge).
- Missing images simply produce placeholders; resolver tolerates absent IDs.

### Operational Guidance

- Safe to delete any prefix where blobs have `status=unconfirmed` and are older than configured grace period (e.g., 24h).
- A future maintenance script should: list unique prefixes, join with DB `boxes.image_id`/`spaces.image_id`, delete unreferenced or stale unconfirmed.
- If metadata write fails for one blob, function logs a warning; confirm can be reissued.

---

## DB Migrations

Migrations live in `db/migrations/`. Run them against the remote database using the Supabase CLI:

```powershell
# One-time: link this project to your Supabase remote
npx supabase link --project-ref <your-project-ref>

# Apply a migration file to the remote database
npx supabase db query --linked --file db/migrations/<migration-file>.sql
```

Always apply the migration **before** deploying new frontend/API code that depends on the schema change.

## Supabase Types

```powershell
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

### Additional Environment Variables (Image Host Override)

The Azure Function `GetImageUrls` supports an optional environment variable to rewrite the host portion of generated SAS URLs (useful for serving images through a custom domain / CDN while still leveraging signed query parameters):

```
BLOB_CUSTOM_HOST=storagemanagerstatic.example.com
```

Behavior:
- When set, each blob SAS URI returned by `/api/images/urls` will have its `Host` replaced with `BLOB_CUSTOM_HOST`, preserving the full path and SAS query string (signature remains valid because only the authority portion changes).
- When not set, the raw Storage Account blob endpoint host is used.

Prerequisites / Notes:
- Your custom host should CNAME to the underlying Blob endpoint or be fronted by a service (e.g., Azure Front Door / CDN) that forwards to it.
- Ensure HTTPS is configured (cert + binding) on the fronting service / custom domain.
- If you use aggressive CDN caching, remember SAS tokens here currently expire after 1 hour (Cache-Control is set to `public, max-age=3600`).
- Local development: you can add the setting to `api/local.settings.json` under `Values`:
  ```json
  {
    "IsEncrypted": false,
    "Values": {
      "AzureWebJobsStorage": "UseDevelopmentStorage=true",
      "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
      "StorageAccountConnectionString": "<your-connection-string>",
      "BLOB_CONTAINER_NAME": "images",
      "BLOB_CUSTOM_HOST": "storagemanagerstatic.local.test" 
    }
  }
  ```

If you change `BLOB_CUSTOM_HOST` in production, previously cached URLs (with the old host) will continue to function until their SAS expiry, after which clients will request fresh URLs reflecting the new host.

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

