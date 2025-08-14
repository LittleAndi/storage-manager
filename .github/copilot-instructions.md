---
applyTo: "**"
---

# **Frontend Project Copilot Instructions**

## **Project Overview**

A modern Single Page Application (SPA) built with a JavaScript/TypeScript frontend framework (e.g., React, Vue, Svelte, or similar).

- UI components are modular, typically organized in a `components/` directory.
- Pages/views are organized in a `pages/` or `views/` directory.
- Application logic is primarily client-side unless otherwise stated.

The app serves as a user-facing interface for its intended domain (e.g., dashboards, analytics, content browsing). Any domain-specific documentation or content may be stored locally in markdown, JSON, or another structured format.

When creating a project from scratch, create it in the existing vscode workspace, do not create a new workspace.

## **Using Tailwind CSS with Vite**

To set up Tailwind CSS in a Vite project, follow these steps:

1. **Create a Vite project (if you don't have one):**

```bash
npm create vite@latest my-project
cd my-project
```

2. **Install Tailwind CSS and the Vite plugin:**

```bash
npm install tailwindcss @tailwindcss/vite
```

3. **Configure the Vite plugin:**
   In your `vite.config.ts` or `vite.config.js`, add:

```js
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

4. **Import Tailwind CSS in your main CSS file:**
   In your main CSS file (e.g., `src/style.css`), add:

```css
@import "tailwindcss";
```

5. **Start the development server:**

```bash
npm run dev
```

6. **Use Tailwind utility classes in your HTML/JSX:**
   Example:

```html
<h1 class="text-3xl font-bold underline">Hello world!</h1>
```

For more details, see the [official Tailwind CSS Vite guide](https://tailwindcss.com/docs/installation/using-vite).

## **Using shadcn/ui with Vite**

To add shadcn/ui to your Vite + React + Tailwind project:

1. **Run the shadcn/ui init command:**

   ```bash
   npx shadcn@latest init
   ```

   This sets up `components.json` and asks you a few configuration questions.

2. **Add a component:**

   ```bash
   npx shadcn@latest add button
   ```

   This will add the Button component to your project.

3. **Import and use the component:**
   Example usage in your app:

   ```jsx
   import { Button } from "@/components/ui/button";

   function App() {
     return (
       <div className="flex min-h-svh flex-col items-center justify-center">
         <Button>Click me</Button>
       </div>
     );
   }
   ```

4. **(Optional) Configure path aliases:**
   Add the following to your `tsconfig.json` and `tsconfig.app.json`:
   ```json
   "compilerOptions": {
     "baseUrl": ".",
     "paths": {
       "@/*": ["./src/*"]
     }
   }
   ```
   And in your `vite.config.ts`:
   ```js
   import path from "path";
   // ...existing code...
   resolve: {
     alias: {
       "@": path.resolve(__dirname, "./src"),
     },
   },
   // ...existing code...
   ```

Install more components when needed using `npx shadcn@latest add [component]`.

For more details, see the [official shadcn/ui Vite guide](https://ui.shadcn.com/docs/installation/vite).

## **Key Workflows**

### **Development**

1. **Install dependencies:**

   ```bash
   npm install
   ```

   _(Or use `yarn install` / `pnpm install` depending on the package manager.)_

2. **Start development server:**

   ```bash
   npm run dev
   ```

3. **Build for production:**

   ```bash
   npm run build
   ```

4. _(Optional)_ Run a local preview of the production build:

   ```bash
   npm run preview
   ```

### **Deployment**

- Follow the project’s deployment method (e.g., hosting service UI, CLI commands, or CI/CD pipeline).
- Refer to the project’s **README.md** for service-specific instructions (e.g., Vercel, Netlify, GitHub Pages, Lovable).

### **Linting & Formatting**

- **Linting:** Configured via ESLint (`eslint.config.js` or `.eslintrc.*`).
- **Formatting:** Prettier and/or TailwindCSS config as per `tailwind.config.*` or `.prettierrc`.
- Run:

  ```bash
  npm run lint
  npm run format
  ```

## **Conventions & Patterns**

- **Component Structure:**

  - UI primitives and reusable components in `components/ui/`.
  - Domain-specific or page-specific components in `components/`.
  - Pages/routes in `pages/` (or `views/`) mapped by the routing library.

- **Styling:**

  - Prefer utility-first CSS (e.g., TailwindCSS) or the project’s chosen styling convention.
  - Keep global styles in a dedicated stylesheet (e.g., `src/styles/global.css`).

- **TypeScript:**

  - Enforce strict typing for props, state, and data models.
  - Use `interface` or `type` for data contracts.

- **Content Management (Optional):**

  - Static content may be stored in markdown (`.md`), JSON, or similar.
  - Dedicated renderers handle content display.

- **No Backend (If Applicable):**

  - All logic is client-side unless otherwise specified.
  - API integrations are handled via external service endpoints.

## **Integration Points**

- **Hosting/Deployment Service:**

  - Managed through the chosen platform’s UI or CLI.
  - Custom domains configured via hosting provider settings.

- **External APIs:**

  - Any integrations are documented in the README or a dedicated `docs/` folder.

## **Examples**

- **Adding a Component:** Create a new file in `components/`, export it, and import it into the relevant page.
- **Updating Content:** Edit the relevant `.md` / `.json` / `.ts` content source.
- **Adding a Page:** Create a file in `pages/` and register it in the routing configuration.

## **References**

- `README.md` — setup, development, and deployment instructions.
- `components/`, `pages/`, and `docs/` — examples of structure and patterns.
- Linting/formatting configs — for code quality and consistency rules.

## Additions

### **shadcn/ui AlertDialog Destructive Action Styling**

For destructive actions in `AlertDialog`, use the `buttonVariants` utility for styling:

```tsx
<AlertDialogAction
  className={buttonVariants({ variant: "destructive" })}
  onClick={handleDelete}
>
  Delete
</AlertDialogAction>
```

### Note: The `variant` prop is not directly supported on `AlertDialogAction`. See [shadcn-ui/ui issue #1115](https://github.com/shadcn-ui/ui/issues/1115) for details.
