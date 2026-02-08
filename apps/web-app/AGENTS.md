# Fin-Folio Web - React Frontend

## Overview

This is the React frontend application for Fin-Folio, built with Vite.

## Structure

```
src/
├── main.tsx       # React entry point (StrictMode, root mount)
├── App.tsx        # Root application component
└── index.css      # Global styles
public/            # Static assets served as-is
index.html         # HTML entry point
```

## Key Patterns

- **Components**: Use functional components with hooks. Files use `.tsx` extension.
- **Styling**: CSS files co-located with components. Import directly in component files.
- **State Management**: Use React hooks (`useState`, `useReducer`, `useContext`) for state. Add a dedicated state library only when complexity warrants it.
- **Routing**: Add `react-router` when the app needs multiple pages.

## Build Pipeline

Vite handles bundling. TypeScript is used for type-checking only (`noEmit: true` in tsconfig).

```bash
pnpm run dev       # Vite dev server with HMR
pnpm run build     # tsc -b (type check) + vite build (bundle)
pnpm run preview   # Preview the production build locally
```

## Configuration

- TypeScript extends `@fin-folio/tsconfig/react.json` (ES2022, DOM libs, JSX, bundler resolution)
- ESLint extends `@fin-folio/eslint-config/react.mjs` with React Hooks and React Refresh plugins
- Vite config in `vite.config.ts` with `@vitejs/plugin-react`

## Development

The dev server starts with HMR enabled. Changes to `.tsx` and `.css` files reflect instantly in the browser.
