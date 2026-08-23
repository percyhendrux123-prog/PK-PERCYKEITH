# GROK CONTEXT — PK-PERCYKEITH

Brief for any Grok bot asked to work on this repo. The canonical workforce definition
lives in `PKFIT-architect-/grok/` — start at `grok/WORKFLOW.md`. This file describes only
what is true *here*.

## What this repo is

`pkfit · share` — a scroll-driven share page for a PKFIT training week, plus the
client-facing coaching console.

Six acts: hero → stat morph → week chart → PR moment → coach note → CTA.

| | |
|---|---|
| Stack | Vite + React 18, lucide-react, Supabase (magic-link auth) |
| Tokens | The `T` object at the top of `src/App.jsx`. No CSS framework |
| Type | **Fraunces + Space Grotesk** — deliberately *not* the marketing site's stack |
| Entry | `src/main.jsx` → `src/App.jsx`; sections are local components |
| Data | The `SHARE` const in `App.jsx` is a mock payload. In production it decodes `/share/:id` |
| Motion | Respects `prefers-reduced-motion: reduce` — parallax, count-ups, and bounce cues collapse to instant |

## Where it sits in the funnel

**Post-purchase.** This page is handed to someone who already paid. It is not an
acquisition surface and must never read as one.

That is why the type stack differs from `PKFIT-architect-`. The marketing site sells a
system to a cold stranger, so condensed uppercase and mono read as instrumentation.
This page is a client's own proof, and Fraunces' warmth is what makes "your week 4" feel
earned rather than sold. **Do not unify the two type stacks.**

What *is* shared with the marketing site: color roles, spacing scale, radius rules,
motion curves, and the entire NEVER list in `pkfit-design`.

## Rules for a bot working here

1. Load the `pkfit-voice` and `pkfit-design` skills first. The voice contract and the
   ethical floor apply to every string rendered on this page.
2. No emoji, no exclamation points, no hype vocabulary — including in coach notes, PR
   captions, and empty states.
3. **Client data is real.** Never invent a client name, a lift number, a PR, or a week
   of training data. Anything used as proof elsewhere requires consent and redaction.
4. Never surface a $37 or coaching CTA to a cold recipient of a shared page. A shared
   card points at the free rung — the diagnostic — never at a checkout.
5. Keep the `prefers-reduced-motion` fallbacks intact on any animation you touch.

## Open UX item

The six-act scroll ends on a single CTA aimed at a client who already bought — the
highest-effort, lowest-yield ask in the funnel. The page's real asset is that clients
send it to people. Splitting act six into a primary "send this to someone" action and a
quieter personal next step is logged in `PKFIT-architect-/grok/03_DESIGN_CONTRACT.md`.
