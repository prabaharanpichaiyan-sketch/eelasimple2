---
name: Expo app as static web (Netlify)
description: How the mobile app is exported to a static SPA for Netlify/static hosts
---

The `artifacts/mobile` Expo app doubles as a web app via `react-native-web` and is
deployed to static hosts (e.g. Netlify) as a single-page app. Config: `web.output:
"single"` + `web.bundler: "metro"` in `app.json`; `export:web` script runs
`expo export --platform web --output-dir dist`; root `netlify.toml` sets the build
command, publish dir (`artifacts/mobile/dist`), and the SPA redirect `/* → /index.html`.

**Why static works:** the app is self-contained — it talks directly to Supabase from
the client and does not import any `@workspace/*` lib at runtime, so there is no server
or workspace-lib build step needed for hosting.

**How to apply / gotchas:**
- `EXPO_PUBLIC_*` vars are inlined at BUILD time. They must be set in the host's build
  environment (Netlify UI), not just at runtime, or the app falls back to the
  placeholder Supabase config and all network requests fail.
- **Netlify silently drops dot-directories on deploy.** pnpm hashes bundled assets
  (e.g. fonts) into `dist/assets/__node_modules/.pnpm/...`; that `.pnpm` dir never
  reaches Netlify, the font 404s, the SPA fallback serves index.html, and the browser
  reports "Failed to decode downloaded font" / "OTS parsing error: invalid sfntVersion"
  (the HTML's `<` parsed as a font). Symptom of any static asset returning HTML = the
  file wasn't deployed and the catch-all redirect caught it. Fix: a post-export step
  (chained into `export:web`) renames the `.pnpm` asset dir to `pnpm` and rewrites the
  `__node_modules/.pnpm` references in the bundle. Generalizes to any dot-dir in dist.
- Keep the tab bar / UI free of native-only modules that crash on web (no `expo-symbols`
  SymbolView, no `expo-glass-effect`); icons use `react-native-svg`.
- The `expo-router` plugin `origin` in `app.json` points at replit.com for the dev
  preview; harmless for the client SPA (no API routes / OAuth redirect), can be set to
  the production domain if deep-linking needs it.
