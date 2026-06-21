# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## What this is

**pkfit-share** (`package.json` name) is a Vite + React 18 single-page app for
**PKFIT / Percy Keith**, an online fitness coaching brand. It is one deployable
that serves three distinct surfaces from one bundle:

1. **`/` — Share page** (`src/App.jsx`): a scroll-driven, animated "your training
   week" story page. Six acts: hero → stat morph → week chart → PR moment →
   coach note → CTA. Currently renders a hardcoded mock payload (`SHARE`).
2. **`/console` — Operator console** (`src/Hub.jsx`): the coach's dashboard.
   Lists clients, recent activity, weekly stats, a command palette, and an AI
   assistant panel (currently demo mode). Auth-gated.
3. **`/c/:clientId` — Client detail** (`src/ClientDetail.jsx`): per-client view
   with workout history, check-ins, coach notes, and a DM/messaging thread.

`/hub` is a legacy alias that redirects to `/console` (both in the SPA router
and via a 301 in `netlify.toml`).

## Tech stack

- **Build:** Vite 5 (`vite.config.js`, dev server on port 5173, `host: true`).
- **Framework:** React 18 + `react-router-dom` v7 (`BrowserRouter`, routes in
  `src/main.jsx`).
- **Backend:** Supabase (`@supabase/supabase-js`) — auth + Postgres + realtime.
- **Icons:** `lucide-react`.
- **Styling:** No CSS framework. Styles are **inline style objects** plus a few
  injected `<style>` strings per component. Design tokens are JS objects named
  `T` (App), `TK` (Hub, auth), defined at the top of each file. Global resets
  and `prefers-reduced-motion` overrides live in `src/styles.css`.
- **Fonts:** Loaded from Google Fonts in `index.html` — Fraunces, Space Grotesk,
  Geist, Geist Mono.

## Commands

```bash
npm install
npm run dev      # vite dev server → http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the built dist/
```

There is **no test runner, linter, or formatter** configured. CI
(`.github/workflows/ci.yml`) only runs `npm ci && npm run build` on PRs and
pushes to `main`. "Passing" means the build succeeds — keep it green.

## Project layout

```
index.html              Entry HTML — meta/OG tags + Google Fonts
vite.config.js          Vite + React plugin config
netlify.toml            Build settings + redirects (/hub→/console, SPA fallback)
src/
  main.jsx              React root + router (route → component map)
  App.jsx               / — share page (mock SHARE payload, scroll animations)
  Hub.jsx               /console — coach console (live Supabase data)
  ClientDetail.jsx      /c/:clientId — client view + messaging
  styles.css            Global resets + reduced-motion overrides
  lib/
    supabase.js         Supabase client singleton (env-driven, hardcoded fallback)
    auth.jsx            useAuth hook, signOut, SignIn (magic-link) component
public/
  favicon.svg, og.svg   Static assets (Open Graph preview)
scripts/
  netlify-domain.sh     Manage Netlify custom-domain aliases via the API
.github/workflows/ci.yml  Build-only CI
.claude/skills/         Vendored "antigravity-awesome-skills" set (~600 skills);
                        tooling only — NOT application code. Do not edit by hand.
```

## Supabase data model

The console and client pages read live data. Tables referenced in code (schema
`public`):

- **`profiles`** — clients and coaches. Filter `role = 'client'`. Columns used:
  `id, name, email, plan, start_date, loop_stage, created_at, avatar_path,
  coach_notes, role`.
- **`workout_sessions`** — `id, client_id, performed_at, duration_min, rpe_avg, notes`.
- **`check_ins`** — `id, client_id, date, weight, body_fat, notes, photo_path, created_at`.
- **`payments`** — `client_id, status, plan, current_period_end`.
- **`dm_threads`** — messaging threads; `last_activity_at`.
- **`dm_messages`** — messages within a thread.

Realtime: both pages subscribe to `postgres_changes` and re-fetch on any change
(Hub channel `pk-console-changes`; ClientDetail channel `pk-client-${id}`).

### Auth

Passwordless **magic-link (OTP)** via Supabase (`signInWithOtp`). The flow lives
in `src/lib/auth.jsx`: `useAuth()` returns `{ loading, session }`, `SignIn`
renders the email form, `signOut()` ends the session. Redirect target after
clicking the email link is `${origin}/console`. Session storage key is
`pk-hub-auth` (`src/lib/supabase.js`).

### Environment variables

`src/lib/supabase.js` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`,
falling back to hardcoded project values if unset. In Vite, only `VITE_`-prefixed
vars are exposed to the client. The anon/publishable key is public by design;
access control is enforced by Supabase Row Level Security, not by hiding the key.

## Conventions

- **Single-file components.** Each route is one large `.jsx` file; sub-sections
  are local components defined in the same file, not separate modules. Match this
  pattern rather than splitting files unless asked.
- **Inline styles + token objects.** Style with the `T`/`TK` token object at the
  top of the file. Reuse existing tokens (e.g. `gold: #C9A961`, near-black
  backgrounds) instead of introducing new hex values. The brand look is dark,
  glassy (`backdrop-filter` blur), gold accent, mono labels.
- **Typography roles:** Geist Mono (uppercase, letterspaced) for labels/CTAs;
  Geist / Space Grotesk for body; Fraunces / heavy weights for display.
- **Accessibility:** Honor `prefers-reduced-motion`. The share page collapses
  parallax, count-ups, and bounce cues to instant; keep new motion guarded the
  same way (see `src/styles.css` and the `@keyframes` in `App.jsx`).
- **Routing:** Add routes in `src/main.jsx`. Unknown paths fall through to the
  share page (`path="*"`). Preserve the `/hub`→`/console` redirect.
- **External links:** The share-page CTA and console intake button point at
  `https://pkfit-intake.netlify.app` (the client intake app).

## AI assistant panel

`Hub.jsx` includes an AI panel running in **demo mode** (`aiDemoResponse`,
labeled "DEMO MODE"). It returns canned responses and prompts the user to add an
Anthropic or Gemini key in Settings → AI. There is no live LLM call wired up yet;
do not assume a real model is connected.

## Deployment

Hosted on **Netlify** (site `pkfit-share`, `*.netlify.app`). `netlify.toml`:
build `npm run build`, publish `dist`, Node 20. Redirects: `/hub`→`/console`
(301), then an SPA catch-all rewriting everything else to `/index.html` (200) —
required so client-side routes like `/c/:id` deep-link correctly. Manage custom
domains with `scripts/netlify-domain.sh {list|add|remove}` (needs `NETLIFY_TOKEN`).

## Git & PR workflow

- Branch from `main`; never commit directly to it.
- CI must pass (the build) before merge.
- Keep commits scoped and descriptively messaged. Recent history shows one
  feature/fix per PR (e.g. "Wire real Supabase anon auth", "Rename /hub to
  /console").

## Gotchas

- The share page data is a **mock** (`SHARE` const at the top of `App.jsx`). The
  comment notes it would eventually be decoded from a `/share/:id` route — that
  route does not exist yet.
- Changing Supabase column names or table names requires matching the `.select()`
  strings in `Hub.jsx` / `ClientDetail.jsx`; there is no shared schema/types file.
- `.claude/skills/` is large (hundreds of vendored skill folders). Avoid scanning
  or editing it as part of application work; it is unrelated to the app build.
