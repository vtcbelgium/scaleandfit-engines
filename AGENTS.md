# AGENTS.md — ScaleAndFit Engines (`@scaleandfit/engines`)

1. **Pure TypeScript Only:** Every module under `src/` MUST be 100% pure, deterministic, zero-dependency TypeScript. No DOM APIs (`window`, `document`), no Node `fs`/`http` imports inside `src/`, and zero network calls (`fetch`, `XMLHttpRequest`).
2. **Domain Organization:**
   - `src/sizer/` — Screens, monitors, mattresses, and airline carry-on/personal-item geometry.
   - `src/paper/` — Millimeter-exact printable paper grids, ISO/US holiday calendars, and Avery die-cut coordinates.
   - `src/footwear/` — Cross-brand Mondopoint (`mm`) shoe size converter and ISO 8653 / credit-card calibrated ring sizer.
   - `src/photo/` — Country biometric passport/visa/ID specifications, head-crown-to-chin crop box solver, and 300-DPI 4x6 tiling layout.
3. **Closed-Valve & Sovereign Copy Rules:**
   - Never add ad scripts, affiliate URLs, payment links, or anti-ad rhetoric (`"Zero Ads"`, `"Ad-Free"`, `"No Ads"`) in code comments, strings, or docs.
4. **Always Verify Before Committing:**
   - Run `npx vitest run` and `npx tsc --noEmit` until all checks exit `0`.
