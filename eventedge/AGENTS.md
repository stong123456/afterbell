# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## askstone visual source of truth

- Use `design/eventedge-workbench-spec.png` as the primary visual target.
- The user-facing product brand is lowercase `askstone`, paired with `askstone.xyz`. `EventEdge Engine` is the internal causal reasoning engine name, not the primary product name.
- Preserve the three-column Evidence Workbench structure from the selected concept: chronological evidence stream, causal reasoning canvas, and fixed decision inspector.
- Preserve the black/obsidian palette with acid-lime primary accents and amber/coral semantic risk colors.
- Keep the desktop workbench visually concentrated: cap the four-panel canvas near 1640px, use an approximately 88 / 264 / flexible / 360 column rhythm, and move the decision inspector below the workspace under 1440px instead of squeezing or clipping it.
- Live source headlines and summaries must be clamped, hashes must never overflow their cards, and the causal chain must remain visually contiguous at both 1873px desktop and 390px mobile widths.
- Product UI is Chinese-first by default, with a complete English/Chinese switch for the global hackathon audience. Persist the selected locale and never ship mixed-language interface states.
- The core interaction must remain evidence -> reasoning -> human review/signature -> X Layer receipt. Never collapse this into a passive dashboard.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
