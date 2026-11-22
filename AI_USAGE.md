# AI usage

## Tools and models

I used **Claude Code** (Anthropic's CLI agent) with **Claude Opus 5.5** for most of the build: planning, writing code and tests, running installs, type checks, tests and Docker. I reviewed and ran everything myself before pushing.

## Agent instruction file

[`CLAUDE.md`](CLAUDE.md) is committed. I kept it short and put in the things from the brief I didn't want the agent drifting away from: product data only through the backend, keeping the data source and email provider swappable, no secrets in the repo, plain-text emails, and a test for every acceptance criterion.

## Plan

Before any code, I had the agent write out a plan and went through it with it:

1. React + TypeScript on the client and Node + TypeScript on the backend. I work mostly in Node/TypeScript and Python day to day, so one language across both sides made sense, and it's the quickest way to get something clickable.
2. Backend first, built around interfaces: a `ProductSource` with a Fake Store adapter and a cache in front of it, a `CatalogueService` for the rules, an `EmailSender` for enquiries, and a thin Express layer on top.
3. Mailpit in docker compose as the "sales inbox", so whoever reviews this can actually see the email without signing up for anything.
4. Frontend pages done one acceptance criterion at a time, with tests named after the criteria.
5. Docker compose with nginx proxying `/api`, so the whole thing runs with one command.
6. Docs last.

## Key prompts / moments

1. **Designing around what's going to change.** The brief says the data source, look and feel and email provider will all change, so I asked for those to be the boundaries. That's where `ProductSource`, `EmailSender` and the CSS tokens came from, all wired up in `server.ts`.
2. **Filling the gaps in the criteria.** "I have chosen 5 products" doesn't say how, so I went with an ordered list of ids in config, falling back to the highest rated if nothing is set. Same idea for how many products count as "top rated" in a category. Search requires every word to match, because otherwise "cotton jacket" returns more results than "jacket". All of it is in DECISIONS.md.
3. **Making the email part checkable.** I didn't want "trust me, it sends an email". Plain SMTP to Mailpit lets you see it land, and the same code can point at SES later.
4. **Tests that follow the acceptance criteria.** I asked for the frontend tests to walk through each Given/When/Then on the real pages, with only `fetch` mocked, rather than testing components in isolation.

## Where the AI got things wrong

- **Vite config.** The first `vite.config.ts` imported `defineConfig` from `vite` but had a Vitest `test` block in it, and the file was included in the browser tsconfig, so `tsc` failed. The type check caught it. Importing from `vitest/config` and excluding the file from the browser tsconfig fixed it.
- **Git identity.** The agent was about to commit with my global git config, which has my work email, and `gh` was logged into my work GitHub account. I spotted it before anything was pushed, set a local identity on the repo, and switched `gh` to my personal account.
- **Overselling in the docs.** The first draft of this file described things more neatly than they actually happened, so I rewrote it to match what really went on.
- **Featured products in the wrong order.** I checked that the home page keeps the order the ids are configured in, not sorted by rating, because if the business is hand-picking products, order is part of the choice. There's a test for it now.

## Things I made sure of while reviewing

- The cache doesn't hold on to a failed call. If Fake Store is down for a second, the next request tries again instead of serving the error until the TTL runs out. Tested.
- The email subject has newlines stripped and the body is plain text, since product titles come from an outside API and the message comes from customers.
- When the product API fails, the client gets a plain 502 with no internal details. There's a test that the upstream host never shows up in the response.
- I went with Express 4 over 5 because the typings are more settled. In-memory caching and sending email inside the request are fine for a PoC. What I'd change for production is in DECISIONS.md.

## Time spent

Around 2 hours 45 minutes in total, which is a bit over the time-box:

- Planning and reading the brief: ~25 min
- Building (with the agent): ~1 hr 10 min
- Testing, including running the whole thing in Docker and checking the email in Mailpit: ~30 min
- Reviewing the code and writing up the docs: ~40 min
