# askstone Design QA

## Comparison target

- Source visual truth: `C:\Users\Administrator\Documents\ChatGPT\OKX黑客松\eventedge\design\eventedge-workbench-spec.png`
- Browser-rendered implementation: `C:\Users\Administrator\.codex\visualizations\2026\08\13\019ffa00-eefe-7963-af8b-3bd2a9e7ba12\eventedge-implementation-1536-final-v5.png`
- Full comparison: `C:\Users\Administrator\.codex\visualizations\2026\08\13\019ffa00-eefe-7963-af8b-3bd2a9e7ba12\eventedge-design-comparison-passed.png`
- Source pixels: 1536 x 1062
- Implementation pixels: 1536 x 1062
- CSS viewport: 1536 x 1062
- Density normalization: source and implementation compared at identical pixels; browser device scale factor 1.
- State: Radar, CPI replay complete, Hedge selected, wallet disconnected, receipt ready to sign.

## Full-view comparison evidence

The final comparison preserves the source's four visible tracks: app rail, source stream, causal workspace, and decision inspector. Primary vertical anchors align: event header, reasoning-map divider, reasoning nodes, asset impacts, decision sections, sign button, and receipt. The implementation uses the same black/acid-lime system and keeps the evidence-to-decision reading direction intact.

## Focused region comparison evidence

- Header comparison: `C:\Users\Administrator\.codex\visualizations\2026\08\13\019ffa00-eefe-7963-af8b-3bd2a9e7ba12\eventedge-focus-header.png`
- Reasoning-map comparison: `C:\Users\Administrator\.codex\visualizations\2026\08\13\019ffa00-eefe-7963-af8b-3bd2a9e7ba12\eventedge-focus-map.png`
- Decision-inspector comparison: `C:\Users\Administrator\.codex\visualizations\2026\08\13\019ffa00-eefe-7963-af8b-3bd2a9e7ba12\eventedge-focus-decision.png`

Focused inspection was required because the confidence breakdown, node evidence rows, decision constraints, and receipt copy are too small to judge from the combined full view alone.

## Required fidelity surfaces

- **Fonts and typography:** IBM Plex Sans Variable and IBM Plex Mono reproduce the narrow institutional tone, tabular numerals, compact labels, and high-contrast headline. Control text is explicitly sized; no browser-default button typography remains.
- **Spacing and layout rhythm:** final columns are 122 / 270 / flexible 744 / 400 pixels at the comparison viewport. Node positions and widths align to the source. The right-panel content gutter and risk-row cadence were corrected during QA.
- **Colors and visual tokens:** background `#050706`, lime `#c8ff32`, supporting lime `#9eea4f`, amber `#ffc247`, coral `#ff6259`, text, muted text, and dividers map to the selected concept.
- **Image and icon fidelity:** the source contains no photographic or illustrative raster assets. Phosphor icons provide the closest matching thin institutional icon family. No placeholder images, emoji, handcrafted SVGs, or fake raster content are used.
- **Copy and content:** title, event timestamp, source labels, confidence factors, Trade/Hedge/Wait controls, risk constraints, trust copy, and X Layer receipt labels match the accepted design. Above-the-fold copy diff: no material additions, removals, or renamed controls.

## Primary interactions tested

- Replay reduced the source stream to one item, then restored all ten chronologically.
- Trade changed rationale and maximum loss; Hedge restored the selected reference state.
- Probability toggle hid all three displayed impact probabilities and restored them.
- Review & sign opened the consent sheet.
- Connect wallet changed the consent action to Sign decision receipt.
- Signing closed the sheet, changed receipt status to Recorded on X Layer, and revealed the transaction hash.
- Browser console errors and warnings checked: none.
- Mobile viewport checked at 390 x 844. Document width stayed within the viewport, and the Replay controls no longer overlap event copy.

## Comparison history

### Pass 1

- **P1:** event title wrapped and navigation was vertically centered rather than source-aligned.
  - Fix: removed the replay control from header grid width calculation, locked title wrapping, and moved navigation to the upper rail.
- **P2:** reasoning nodes were too wide and duplicate edge-confidence labels collided.
  - Fix: matched 120-pixel nodes, 55-pixel relation gaps, source-like vertical node height, and kept one confidence label per edge.

### Pass 2

- **P2:** mobile Replay controls retained desktop absolute positioning and covered event copy.
  - Fix: changed the mobile header to a single-column flow and restored the controls to normal document layout.

### Pass 3

- **P2:** decision-inspector content was too wide and typography too small, changing line breaks and information density.
  - Fix: restored the source-like right gutter, increased control/body type, and tightened risk-row vertical rhythm.
- **P2:** the receipt required scrolling at the native viewport.
  - Fix: reduced deterministic risk-row heights; final inspector `scrollHeight` equals `clientHeight` at 1062 pixels.

## Remaining P3 polish

- Asset branches use a stable orthogonal connector bus instead of the source mock's hand-drawn curved paths. The causal relationship remains explicit and connected; a production graph renderer can provide curved, animated edges after the data layer is integrated.
- Small copy wraps differ slightly because the mock's generated font is not an identifiable distributable typeface.

## Final result

final result: passed
