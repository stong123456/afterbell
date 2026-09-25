# AskStone — Submission and demonstration

**AI Thesis OS for tokenized equities**

[Live demo](https://askstone-eventedge.chunmingyang8.chatgpt.site/) · [Source](https://github.com/stong123456/afterbell) · [Automated checks](https://github.com/stong123456/afterbell/actions)

## Project pitch

Most research tools explain what happened. AskStone remembers why you wanted a trade and checks whether later evidence changes those reasons.

Enter one idea. Stone Brief turns it into falsifiable assumptions and monitoring search terms. Challenge tests the opposing view while preserving that baseline. Remember saves it. What Changed compares only evidence published since the previous review, cites sources, and separates challenged assumptions from missing evidence.

The intended competition fit is AI Trading Desk / decision stress testing. Consult the [official rules](https://bitget-ai.gitbook.io/bitgetai_hackathons2/base-camp-hackathon-s2-cn) for current dates and submission requirements; this document does not claim a submission has been made.

## 90-second demonstration

- **0–15s / Ask Stone:** “我认为 NVDA 的 AI 需求能继续支持增长。”
- **15–35s / Stone Brief:** show proposed assumptions, invalidation conditions, monitoring terms and source citations.
- **35–50s / Challenge:** show the opposing case and explain that the original baseline has not changed.
- **50–60s / Remember:** save and open the simple Memory card.
- **60–85s / What Changed:** open a previously saved, genuine thesis with evidence published after its last check. Show the exact review window, one assumption's evidence and the reason it needs attention or remains unclear.
- **85–90s / Share:** download the review card. Close with “Remember why. See what changed.”

Do not fabricate an old timestamp or a challenged outcome for the demonstration. A thesis saved seconds ago may correctly have no new evidence. Source-only briefs must remain visibly labelled; they are not an AI demo.

## Current completion and acceptance

Implemented: public deployment, runtime Qwen/BYOK integration, independent assumption extraction, frozen baselines, incremental reviews, bilingual retrieval, assumption-level selection, browser-local history, share-card download, Markets and CI.

Still unverified: real hosted Qwen end-to-end acceptance. The dedicated competition key is now configured for the Bitget Qwen 3.8 Max gateway. Configuration alone does not certify the full workflow. Hosted Bitget previously returned 403; verify current quote access separately. No user-study outcomes, model calibration, trading performance or full-source recall claims are made.

Before presenting, use an unauthenticated clean browser without a personal key: Ask Stone → real AI Brief → Challenge → Remember → What Changed. Verify API responses identify the actual provider/model, assumptions remain unchanged, and citations fall strictly within the displayed review window. Check `/api/health?probe=1`; distinguish configured_unverified from ready. Preserve a real acceptance log when this test passes.

## Draft public description

AskStone remembers why you wanted a trade, challenges the assumptions, and shows what later evidence changed. An AI research desk for tokenized equities: Ask Stone → Brief → Challenge → Remember → What Changed. Human judgment stays in control.

This text is a draft, not a published social post. Add required competition material only after checking the official submission instructions.
