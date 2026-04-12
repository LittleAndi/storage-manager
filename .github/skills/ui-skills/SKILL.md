---
name: ui-skills
description: Opinionated constraints for building better interfaces with agents.
---

# UI Skills

Opinionated constraints for building better interfaces with agents.

## Stack

- MUST use Tailwind CSS defaults (spacing, radius, shadows) before custom values
- MUST use `motion/react` (formerly `framer-motion`) when JavaScript animation is required
- SHOULD use `tw-animate-css` for entrance and micro-animations in Tailwind CSS
- MUST use `cn` utility (`clsx` + `tailwind-merge`) for class logic
- MUST use shadcn/ui components as the primary UI component library
- SHOULD use TypeScript for all component definitions with proper prop interfaces

## Components

- MUST use shadcn/ui components first before creating custom primitives
- MUST use accessible component primitives for anything with keyboard or focus behavior (`Radix` via shadcn/ui)
- MUST use the project's existing component primitives first
- NEVER mix primitive systems within the same interaction surface
- MUST add an `aria-label` to icon-only buttons
- NEVER rebuild keyboard or focus behavior by hand unless explicitly requested
- SHOULD organize components in `src/components/ui/` for primitives and `src/components/` for composed components

## Interaction

- MUST use shadcn/ui `AlertDialog` for destructive or irreversible actions
- MUST use `buttonVariants({ variant: "destructive" })` utility for destructive actions in `AlertDialogAction`
- SHOULD use structural skeletons for loading states
- NEVER use `h-screen`, use `h-dvh`
- MUST respect `safe-area-inset` for fixed elements
- MUST show errors next to where the action happens
- NEVER block paste in `input` or `textarea` elements

## Animation

- NEVER add animation unless it is explicitly requested
- MUST animate only compositor props (`transform`, `opacity`)
- NEVER animate layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`)
- SHOULD avoid animating paint properties (`background`, `color`) except for small, local UI (text, icons)
- SHOULD use `ease-out` on entrance
- NEVER exceed `200ms` for interaction feedback
- MUST pause looping animations when off-screen
- MUST respect `prefers-reduced-motion`
- NEVER introduce custom easing curves unless explicitly requested
- SHOULD avoid animating large images or full-screen surfaces

## Typography

- MUST use `text-balance` for headings and `text-pretty` for body/paragraphs
- MUST use `tabular-nums` for data
- SHOULD use `truncate` or `line-clamp` for dense UI
- NEVER modify `letter-spacing` (`tracking-`) unless explicitly requested

## Layout

- MUST use a fixed `z-index` scale (no arbitrary `z-x`)
- SHOULD use `size-x` for square elements instead of `w-x` + `h-x`
- SHOULD follow the established folder structure: `src/components/ui/` for shadcn/ui components, `src/components/` for custom components

## Performance

- NEVER animate large `blur()` or `backdrop-filter` surfaces
- NEVER apply `will-change` outside an active animation
- NEVER use `useEffect` for anything that can be expressed as render logic
- SHOULD leverage Vite's build optimizations for production builds

## Design

- NEVER use gradients unless explicitly requested
- NEVER use purple or multicolor gradients
- NEVER use glow effects as primary affordances
- SHOULD use Tailwind CSS default shadow scale unless explicitly requested
- MUST give empty states one clear next action
- SHOULD limit accent color usage to one per view
- SHOULD use existing theme or Tailwind CSS color tokens before introducing new ones
- MUST follow shadcn/ui theming conventions when customizing colors

## Development Practices

- MUST use proper TypeScript interfaces for component props
- SHOULD follow ESLint configuration rules established in the project
- MUST test components in both light and dark modes when theme switching is implemented
- SHOULD use path aliases (`@/` for `src/`) for cleaner imports
