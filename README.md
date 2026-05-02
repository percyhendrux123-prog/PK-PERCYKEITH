# pkfit · share

Scroll-driven share page for a pkfit training week. Six acts: hero, stat morph, week chart, PR moment, coach note, CTA.

## Stack
Vite + React 18, lucide-react icons. No CSS framework — design tokens live in `src/App.jsx` (`T`).

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Structure
- `index.html` — meta tags + Google Fonts (Fraunces, Space Grotesk)
- `src/main.jsx` — entry
- `src/App.jsx` — full page; sections are local components
- `src/styles.css` — global resets + `prefers-reduced-motion` overrides
- `public/og.svg` — Open Graph share preview
- `public/favicon.svg` — favicon

## Notes
- The `SHARE` const at the top of `App.jsx` is the mock payload. In production this would come from decoding `/share/:id`.
- Animation respects `prefers-reduced-motion: reduce` — parallax, count-ups, and bounce cues collapse to instant.
