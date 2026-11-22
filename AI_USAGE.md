# AI usage

## Tools and models
- **Claude Code** (Anthropic's agentic coding CLI) running **Claude Opus 5.5**. It planned the solution, wrote the code, tests and docs, and ran installs, type checks, tests and Docker.
- I gave it the brief, then reviewed and ran the result. I own every line, as the brief requires.

## Agent instruction file
- [`CLAUDE.md`](CLAUDE.md) is committed. It encodes the non-negotiables from the brief: backend-only product access, the three swappable seams (data source, email, look and feel), no secrets, plain-text email, and tests for every acceptance criterion.

## Plan / spec
The agent turned the brief into this plan before writing code:
1. Pick the stack: React + TS and Node + TS. Same language on both sides, and the fastest path to something clickable that can grow.
2. Backend first, built around interfaces: `ProductSource` → `FakeStoreSource` (+ `CachedSource` decorator), `CatalogueService` for the rules, `EmailSender` → SMTP, and a thin Express layer.
3. Use Mailpit as the local "sales inbox", so a reviewer needs no accounts and can see the email arrive.
4. Write the frontend pages per acceptance criterion, with tests named after each criterion.
5. Use Docker Compose for the "under 10 minutes" run, with nginx proxying `/api` so the browser stays same-origin.
6. Write the docs: README, DECISIONS, this file.

## Key moments that shaped the solution
1. **Starting from "what will change".** The brief says data source, look and feel and email provider will all change, so those became the interfaces (`ProductSource`, `EmailSender`, token-based CSS), wired together in one composition root (`server.ts`).
2. **Filling gaps in the criteria with configurable defaults.** "I have chosen 5 products" became an ordered `FEATURED_PRODUCT_IDS` list with a fallback to the highest rated. The category top-rated count is configurable. Search requires every word to match. All of this is recorded in DECISIONS.md.
3. **Making the email criterion verifiable.** Plain SMTP to Mailpit in docker compose means a reviewer can see the email without any account, and the same sender works with AWS SES's SMTP endpoint later.
4. **Mapping tests to acceptance criteria.** The frontend tests walk through each Given/When/Then using the real pages and API client, with only `fetch` mocked.

## Where the AI got something wrong, and how it was caught
- **Vite config typing.** The first `vite.config.ts` imported `defineConfig` from `vite` but contained a Vitest `test` block, and the file was included in the browser `tsconfig`. `tsc` failed with "`test` does not exist" and "cannot find name `process`". Running the type check caught it. The fix was to import from `vitest/config` and exclude the config file from the browser `tsconfig`.
- **Overstated claims in this file.** The first draft of this document described prompts and catches that hadn't happened as written. It was rewritten to describe only what actually happened.
- <!-- TODO (Shagun): add anything you changed or pushed back on during your own review. -->

## Defensive choices to be ready to explain
- The cache drops failed upstream calls instead of caching the error (tested: "does not cache failures").
- The email subject has CR/LF stripped and the body is plain text, because product titles come from an external API and the message comes from customers.
- Upstream failures return a generic 502, and a test checks the upstream host never leaks into the response.
- Express 4 rather than 5 for more settled typings. Caching is in-memory and email is sent in-request, both acceptable for a PoC. The upgrade paths are in DECISIONS.md.

## Time spent
<!-- TODO (Shagun): replace with your honest numbers before submitting. -->
- Agent build session (plan → code → tests → Docker verification → docs): about 1 hour of wall-clock time.
- My own review and understanding of the code: _fill in_.
