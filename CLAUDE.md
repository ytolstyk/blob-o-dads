# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR (http://localhost:5173)
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

No test runner is configured yet.

## Architecture

React 19 + TypeScript SPA built with Vite 8. Entry point is `src/main.tsx` → mounts `src/App.tsx` into `#root`.

- `src/App.tsx` — single root component; all app logic lives here until components are extracted
- `src/App.css` / `src/index.css` — component-scoped and global styles respectively
- `public/icons.svg` — SVG sprite sheet; icons referenced via `<use href="/icons.svg#<id>">` pattern
- Assets in `src/assets/` are bundled by Vite (hashed filenames); assets in `public/` are served as-is

The ESLint config (`eslint.config.js`) uses flat config format with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. To enable stricter type-aware lint rules, see the README for the `recommendedTypeChecked` upgrade path.
