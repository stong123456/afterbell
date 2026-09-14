# AskStone integration — prepared, not deployed

## Existing product

The locally inspected previous AskStone source uses a Sites-compatible Worker, D1 snapshot/receipt storage, server-sent events and X Layer testnet receipts. Its API includes `/api/live`, `/api/stream`, `/api/health` and `/api/receipts`. This is a separate application from AfterBell's Node server. Current public hosting and DNS were not verified in this session: the public fetch failed and opening Name.com was blocked by the approval system's usage limit.

## Proposed domain layout

- `askstone.xyz`: preserve the existing AskStone workbench.
- `afterbell.askstone.xyz`: independent AfterBell service and HTTPS certificate.
- Add a bilingual “AfterBell / US stock research” link to the old workbench after the new endpoint passes verification. No old-product source or DNS was changed.

A subdomain isolates the two `/api/health` routes, assets, research records and deployment lifecycles. The current frontend uses root-relative `/api` requests, so publishing under `/afterbell/` would additionally require coordinated frontend base paths and proxy routing. Do not copy its build over the old site.

## Prepared in this repository

- Docker multi-stage build with an explicit runtime-file list; no `.env`, personal files or journal data enter the image.
- `BIND_ADDRESS` defaults to loopback; production can use `0.0.0.0`.
- `PUBLIC_ORIGINS` permits explicit HTTPS origins and corresponding Host values; arbitrary forwarded headers do not grant access.
- `fly.toml.example` is a template, not an allocated Fly app. Add the actual `https://APP.fly.dev` origin alongside the custom origin when the app is created so the provider URL can be tested first.
- 12 automated tests passed, including allowed HTTPS requests and rejected foreign origins. Docker execution and public deployment were not tested.

## Remaining release steps

1. Create a dedicated hosted service and deploy; leave Qwen credentials absent until authenticated access and a model budget policy are implemented.
2. Verify provider URL, health, news, market, challenge flow and logs.
3. Attach `afterbell.askstone.xyz` to the service. Obtain the actual DNS/ownership records from the platform; no IP or CNAME value is assumed here.
4. Inspect Name.com records and add only the required subdomain records. Preserve apex, `www`, mail and other products.
5. Verify authoritative/public DNS, issued TLS certificate, custom-domain APIs and browser behavior, then add the old-site navigation link.

Fly domain documentation: https://fly.io/docs/networking/custom-domain/
