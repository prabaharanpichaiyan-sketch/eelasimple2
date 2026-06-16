# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/mobile run export:web` — export the mobile app as a static web build to `artifacts/mobile/dist` (for Netlify/static hosting)
- Required env: `DATABASE_URL` — Postgres connection string

## Web hosting (Netlify)

The Expo mobile app (`artifacts/mobile`) also runs on the web via `react-native-web` and exports to a static single-page app. Deploy to Netlify (config in root `netlify.toml`):
- Build command: `pnpm --filter @workspace/mobile run export:web`
- Publish directory: `artifacts/mobile/dist`
- SPA redirect (`/* → /index.html`) is in `netlify.toml`
- Set build-time env vars in Netlify: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Expo inlines `EXPO_PUBLIC_*` at build time, so they must be present when the build runs)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
