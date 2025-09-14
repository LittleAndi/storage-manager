# Developer Guide

## Table of Contents

1. [Supabase Integration](#supabase-integration)
2. [React + TypeScript + Vite](#react--typescript--vite)
3. [ESLint Configuration](#eslint-configuration)
4. [Image Handling Architecture](#image-handling-architecture)
5. [Testing Strategy](#testing-strategy)

---

## 1. Supabase Integration

This project uses [Supabase](https://supabase.com/) for authentication and backend services.

**Key points:**

- Social login (Google, Facebook, etc.) is handled via Supabase Auth.
- Environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required in `.env`.
- See [Supabase docs](https://supabase.com/docs) for setup and configuration.
- You can manage users, roles, and permissions in the Supabase dashboard.
- For local development, ensure your `.env` file contains valid Supabase credentials.

**Example `.env`:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

To add more backend features (database, storage, etc.), use Supabase client APIs in your React app.

---

## 2. React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

---

## 3. ESLint Configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

---

## 4. Image Handling Architecture

The application provides a unified image pipeline for Spaces and Boxes using an `image_id` field stored in the database instead of embedding direct URLs.

### Flow Summary

1. User selects file -> `uploadImage` sends `POST /api/images/{uuid}` (multipart) -> returns `{ image_id, preview_url? }`.
2. If the parent entity (space/box) already exists, `uploadAndMaybeConfirm` immediately calls `confirmImage` with metadata (`space_id` or `box_id`). Otherwise confirmation is deferred until creation.
3. Display components call `resolveImageUrl(imageId)` which internally batches through `getImageUrls` and caches results.
4. Lazy loading is driven by `IntersectionObserver` in `BoxCard` and `SpaceCard` to avoid upfront resolution of offscreen images.

### Key Files

- `src/lib/imageUpload.ts` – low-level API calls: `uploadImage`, `confirmImage`, `getImageUrls` (batch).
- `src/lib/imageUrls.ts` – higher-level single-id + batch cache, in‑flight promise coalescing, prefetch helper.
- `src/components/forms/ImageUploadField.tsx` – reusable upload/preview/clear UI component.
- `src/hooks/useEntityUpdate.ts` – normalizes `image_id: null` to `undefined` in local state after clearing.

### Clearing Images

Setting the form field to empty triggers a patch with `image_id: null`. The hook ensures local entity objects drop the field so UI reverts cleanly.

### Caching Model

| Layer | Purpose | Scope |
|-------|---------|-------|
| In-memory map (`imageUrls.ts`) | Fast repeat access | Session |
| In-flight map | Prevent duplicate network calls for same id(s) | Request window |
| Zustand store `imageUrls` maps | Rehydrate between navigations (lightweight) | Session/localStorage |

### Error / Edge Handling

- Batch resolver returning `null` -> id omitted from final map.
- Upload failure -> user sees inline error; no state mutation occurs.
- Confirm failure is non-blocking for creation (logged / toast).

---

## 5. Testing Strategy

Image logic is tested at multiple layers:

- Unit: `imageUpload.test.ts` & `imageUrls.test.ts` validate API wrapper behavior, caching, dedupe, and error fallbacks.
- Integration: `imageFlow.test.ts` simulates combined upload + confirm + batch URL mapping.
- Integration: `imageClear.test.tsx` ensures nulling an image propagates correctly.

When extending the image system (e.g., adding drag & drop or alt text editing), prefer adding a new focused test file alongside existing ones.


You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
