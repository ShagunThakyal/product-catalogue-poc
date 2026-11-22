# Decisions and assumptions

## Assumptions (where the acceptance criteria are open)

| Area | Assumption |
|---|---|
| "I have chosen 5 products to be top rated" | The business hand-picks them. They are configured as an ordered list of ids (`FEATURED_PRODUCT_IDS`) and shown in that order. If none are configured, or none of the ids exist, we fall back to the 5 highest rated by the data source's rating. Unknown ids are skipped rather than failing the page. |
| Category "top rated" vs "additional" products | Top rated = the 3 highest rated in that category (configurable with `CATEGORY_TOP_RATED_COUNT`). "Additional" = the remaining products in that category, also sorted by rating. A product appears once, not in both lists. |
| Search matching | Case-insensitive substring match on title, description and category. Every word in the term must match (AND), so "cotton jacket" narrows results instead of widening them. An empty term is rejected. |
| Search trigger | Search runs on submit (button or Enter), as the criteria say "click the search button". The results page URL (`/search?q=`) is shareable. |
| Enquiry form fields | Name and email are required. Phone and message are optional. That is enough for sales to reply. |
| "Sales inbox will receive an email" | One plain-text email to a configurable `SALES_INBOX`, with `Reply-To` set to the customer so sales can answer directly. No customer confirmation email (not asked for). |
| "Thank you" message | Shown in place of the form, on the product page. |
| Users, cart, checkout | Out of scope. The MVP is browse + enquire. No accounts. |

## Dropped or simplified, and why

- **No database.** Products come from Fake Store and enquiries are emailed, not stored. Persisting enquiries (for audit or a CRM) is the first thing I'd add, but it's not in the criteria.
- **Filtering, sorting and search all happen in memory** over the cached catalogue. That's fine for 20 products. With a real catalogue it moves into the data source or a search index (see below), behind the same `CatalogueService` methods.
- **Minimal styling.** Look and feel is still being designed, so the CSS is plain and every colour sits in CSS variables on `:root`, ready to be replaced by the real design system.
- **No pagination** on category or search results, for the same 20-product reason.
- **Basic email delivery.** Enquiry emails are sent in-request. If SMTP is down, the customer sees an error and can retry. A queue would remove that dependency (see next steps).
- **No end-to-end browser tests.** The UI tests render the real pages and client against a mocked `fetch`, which covers each acceptance criterion without a running stack. I checked the full stack by hand with Docker + Mailpit.

## How it grows beyond the PoC

The brief says the **data source, look and feel, and email provider will all change**, so those are exactly the seams:

- **Product data source.** Everything depends on the `ProductSource` interface (`listProducts`, `listCategories`) and our own `Product` model, never on Fake Store's payload. Moving to a PIM, a database or Shopify means writing one new adapter and changing one line in `server.ts`. Caching is a separate decorator (`CachedSource`), so it can become Redis or be removed without touching adapters.
- **Email provider.** `EnquiryService` depends on an `EmailSender` interface. SMTP works locally (Mailpit) and in AWS (SES SMTP endpoint). Swapping to the SES SDK, SendGrid or a queue-backed sender is one new class.
- **Look and feel.** The client is split into an API client, pages and presentational components, with styling in one token-based stylesheet. A new design can replace components and tokens without touching data fetching.
- **Clear boundaries.** The client only knows our API. HTTP code only does routing, validation and error mapping. Business rules (featured, category split, search) sit in `CatalogueService`, which has no HTTP or vendor code and is unit tested on its own.
- **AWS-ready.** Both services are stateless containers configured by environment variables, so they fit ECS/Fargate or App Runner, with the static client also deployable to S3 + CloudFront.
- **Mobile later.** Because the backend owns the product contract, an iOS or Android app can reuse the same API.

## Security basics in place

- Input validated with zod on the server (lengths, email format, phone characters). The client validates for fast feedback but the server is the source of truth.
- The enquiry email is plain text, and the subject has CR/LF stripped, so customer input can't inject HTML or headers.
- Enquiries are rate limited (10 per minute per IP). JSON body is capped at 10 KB. Helmet sets security headers.
- Upstream and unexpected errors return generic messages (502/500). Internals are logged, not returned.
- Config is validated at startup. No secrets in the repo; `.env.example` documents everything.

## What I'd do with another day

1. Persist enquiries (Postgres or DynamoDB) and send email from a queue (SQS) with retries, so a mail outage never loses a lead.
2. Move featured products to an admin-editable store instead of an env var.
3. Server-side search with a proper index once the catalogue is real, plus pagination.
4. Add Playwright end-to-end tests in CI against `docker compose`, and a GitHub Actions pipeline running lint, typecheck and tests.
5. Add structured logging and request ids, plus a CAPTCHA or honeypot on the enquiry form.
6. Sketch the AWS deployment (ECS Fargate + ALB, SES, S3/CloudFront) as infrastructure-as-code.
