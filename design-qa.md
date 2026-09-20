# AfterBell three-style QA — 2026-09-20

Scope: production adaptation of all three selected directions, sharing one research flow, not a static recreation of the illustrative news or charts.

## Evidence
Reference directory: C:/Users/Administrator/.codex/generated_images/01a09b4e-efce-7661-a9d2-1ae9630fbda0/
- Briefing: exec-c710c189-43fb-4ab3-b7ec-6721a802b498.png
- Studio: exec-640d86a5-7f8d-4568-b6d8-809b83492b98.png
- Workspace: exec-d0af286d-b9d5-43f2-aacb-627f95cc9636.png
Implementation: design/redesign/{briefing,studio,workspace}-final.png and mobile-final.png.
Desktop requested viewport 1440 x 1024; browser captures are 1440 x 900 or 1425 x 889 depending on scrollbar and browser capture scaling. Reference images are 1488 x 1056. Compared at corresponding content width, not pixel-perfect overlay. Mobile requested viewport 390 x 844, captured 375 x 844; DOM scroll width 375, viewport 390.
All three reference/implementation pairs opened together in one image comparison call. Real Coinbase news replaces illustrative policy news. Focused text checked using DOM snapshots for title, source, CTA and report. No precision contrast measurements claimed.

## Findings and iterations
- P2 fixed: selected NVDA in dark mode lost contrast on hover. Explicit selected/hover tokens restored lime background and dark text. studio-final.png is the post-fix capture.
- P2 fixed: raw bracketed source titles overwhelmed hierarchy. Extract bracket headline; retain complete text in source disclosure.
- Functional fix: saved reports now reopen visibly; tested save, journal and reopen in browser.
- English static mechanism/counter text now uses existing translation dictionary. Original source text and user thesis intentionally remain unchanged.

## Fidelity surfaces
Typography: editorial serif for briefing; sans serif for studio/workspace; readable hierarchy and bounded headlines. Native system font fallbacks intentionally replace unlicensed generated-font approximations.
Layout: warm horizontal briefing, dark guided entry and light three-column workspace; mobile stacks with wrapping controls. Shared data and report flow intentionally replace separate mock-specific screens. Quote/causality details use disclosure to avoid overwhelming first-time readers.
Colors: ivory/forest, navy/lime, cool white/blue; selected, hover and focus states checked. P2 dark selected contrast fixed.
Assets: retained text wordmark; illustrative company logos/decorative marks omitted rather than fabricated. No generated mock news/price chart is presented as live data. Actual Bitget charts remain available in disclosure.
Copy: entry, evidence, uncertainty and next action clearly labeled. No invented probabilities. Real source language preserved.

## Functional checks
- Three style selections work; selected event preserved while switching.
- Refresh retains selected style and language.
- Guided NVDA entry opens event; Buy prepares editable thesis.
- Rule report generated with source/Bitget evidence; save and reopen passed.
- English shell and existing report translation checked.
- Mobile 390px: no horizontal page overflow; header and style picker remain visible.
- Browser error log: empty at report completion.
- Production build passed. Existing 22 tests passed.

## Limits / follow-up polish
Actual BYOK provider invocation not tested without a user key. Chart and deeper reasoning backend semantics were preserved, not comprehensively revalidated. The production adaptation is not a pixel-identical reproduction of each generated screen. Further visual refinements may tune editorial density and optional brand imagery.

final result: passed
