<!-- Copilot / AI agent instructions for contributors and coding agents -->
# Bootflow — Copilot Instructions

This file contains concise, actionable guidance for an AI coding agent working in this repository. Focus on repository-specific patterns, workflows, and files so you can be productive immediately.

1) Big picture
- **What this repo is:** A React + TypeScript frontend built with Vite, Tailwind CSS and shadcn-ui. It integrates with Supabase for database/auth and uses Drizzle (drizzle-kit) for migrations/schema.
- **Where code lives:** UI code in `src/` (alias `@` → `./src` via `vite.config.ts`). Pages are under `src/pages/` and reusable UI primitives under `src/components/ui/`.

2) Key workflows & commands
- Local dev: `npm install` then `npm run dev` (Vite server — configured to run on port `3000` in `vite.config.ts`).
- Build: `npm run build` and preview with `npm run preview`.
- Lint: `npm run lint`.
- Database / migrations (Drizzle):
  - Generate: `npm run db:generate` (runs `drizzle-kit generate`).
  - Migrate: `npm run db:migrate` (note: uses `netlify dev:exec drizzle-kit migrate` — Netlify CLI required in dev environment).
  - Studio: `npm run db:studio` to run drizzle studio (also via Netlify dev).
  - Config: see `drizzle.config.ts` — schema at `./db/schema.ts`, migrations output to `./migrations`. Do NOT edit generated migrations by hand; use drizzle-kit.
- Supabase helpers: many convenient scripts in `package.json`:
  - `npm run supabase:start|stop|reset` — manages local supabase (requires supabase CLI).
  - `npm run supabase:migration` — create a new migration.
  - `npm run supabase:push|pull` — sync DB schema.
  - `npm run supabase:types` — generates TypeScript types into `src/types/database.types.ts` (run after schema changes).
  - `npm run supabase:link` — links local repo to remote project ref (project-ref is set in the script; change only if intentional).

3) Environment & external integrations
- Database: Drizzle config reads `process.env.NETLIFY_DATABASE_URL` (see `drizzle.config.ts`) — repo expects Netlify Neon or equivalent Postgres URL in CI/dev.
- Supabase: project-ref is hardcoded in `package.json` script (`mnjivyaztsgxaqihrqec`). Be careful when using `supabase:link`.
- Netlify: some DB commands are executed via `netlify dev:exec` — ensure Netlify CLI is available when running migrations locally.

4) Project conventions & patterns (concrete examples)
- Import alias: use `@/` to import from `src` (example: `import { Button } from '@/components/ui/button'`). See `vite.config.ts`.
- UI primitives: `src/components/ui/*` contains shadcn-style primitives (Dialog, Tabs, Card, etc.) — prefer these for consistent styling.
- Pages: `src/pages/*` contains route pages. Example: `src/pages/AdminBranding.tsx` implements branding UI that persists settings to `localStorage` (keys used: `brand-config`, `custom-dashboards`, `custom-pages`). Use it as an example for local-only persisted features.
- Hooks: look under `src/hooks/` for data-loading conventions (e.g., `useDashboardData`, `useClientes`) — follow their shape for side effects and data fetching.
- SQL / DB artifacts: repository contains many SQL scripts at the repo root (e.g., `create_tables_clientes_revendas.sql`, `setup_pago_column_complete.sql`, etc.). Those are used for manual DB fixes/seed — reference them when working on DB-related tasks.

5) Editing guidance for AI agents
- When modifying schema/migrations: use `drizzle-kit` commands (`db:generate` / `db:migrate`). Do not hand-edit migration files. `drizzle.config.ts` contains an explicit comment about this.
- When changing types: run `npm run supabase:types` to regenerate `src/types/database.types.ts`.
- When adding features that require environment variables, prefer adding names and an example to `.env.example` (if present) rather than committing secrets.
- Watch for hardcoded project refs or URLs in scripts (e.g., `supabase:link` project-ref and `drizzle.config.ts` NETLIFY_DATABASE_URL). Confirm intent before changing them.

6) Quick code pointers (search patterns)
- Find UI primitives: `src/components/ui/`.
- Find pages: `src/pages/` (e.g., `AdminBranding.tsx`).
- Find hooks: `src/hooks/` (e.g., `useDashboardData`, `useClientes`).
- DB & migrations: `drizzle.config.ts`, `db/schema.ts`, `./migrations/`.
- SQL helpers and migration fixes: repo root `*.sql` files.

7) What to avoid / gotchas
- Do not change generated drizzle migrations manually — use the drift-safe tools provided.
- Do not run `supabase:link` unless you know the intended project ref: it may change the linked project.
- The README still mentions port `5173` but `vite.config.ts` sets `3000` — prefer `vite.config.ts` as the source of truth.

8) If you need to run or test changes locally
- Install deps and run dev server:
  - `npm install`
  - `npm run dev`
- Regenerate DB types after schema changes:
  - `npm run supabase:types`
- Generate/driven migrations with drizzle:
  - `npm run db:generate`
  - `npm run db:migrate` (Netlify CLI required)

9) Where to get more context
- `README.md` — repo overview (in Portuguese).
- `package.json` — scripts and dependencies.
- `drizzle.config.ts` — DB/migrations config.
- `src/pages/AdminBranding.tsx` — example of localStorage-driven admin UI and component usage.

If anything above is unclear or you want me to expand a specific section (DB workflows, component conventions, or examples), tell me which area to expand. I'll iterate.
