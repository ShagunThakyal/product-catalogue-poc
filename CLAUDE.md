# Agent instructions for this repo

Context: proof-of-concept product catalogue that must grow into a real product. The product data source, the look and feel, and the email provider are all expected to change.

## Rules
- TypeScript everywhere, `strict` on. No `any` unless justified in a comment.
- The client must never call the product API directly. All product data goes through `backend`.
- Keep the seams: `ProductSource` (data), `EmailSender` (email), `CatalogueService` (business rules, no HTTP or vendor code). New vendors = new adapter + one line in `server.ts`.
- HTTP layer only routes, validates (zod) and maps errors. Never return internal error details to clients.
- Customer input goes into email as plain text only. Strip CR/LF from anything placed in headers.
- No secrets in the repo. Every new setting goes in `backend/.env.example` with a safe default.
- Every acceptance criterion needs a test. Run `npm test` and `npm run typecheck` in both packages before calling something done.
- Prefer small, readable code over abstractions the PoC does not need yet. Record assumptions in `DECISIONS.md`.
