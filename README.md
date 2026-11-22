# Product Catalogue PoC

A small product catalogue: customers browse featured products, browse by category, search, view product details and send an enquiry that lands in the sales inbox.

- **Client:** React + TypeScript (Vite)
- **Backend:** Node.js + TypeScript (Express)
- **Product data:** [Fake Store API](https://fakestoreapi.com), accessed **only** through the backend
- **Email:** SMTP. Locally this goes to [Mailpit](https://mailpit.axllent.org), a mail catcher that acts as the "sales inbox", so you don't need any account.

Why this stack: the brief prefers TypeScript, and using it on both sides means one language and shared mental models for the product contract. React + Node is also the quickest way to give the entrepreneur something clickable that can grow into production. See [DECISIONS.md](DECISIONS.md) for the trade-offs.

## Run it (Docker, about 2 minutes)

Requires Docker Desktop.

```bash
docker compose up --build
```

| What | URL |
|---|---|
| Catalogue (web app) | http://localhost:8080 |
| Sales inbox (Mailpit) | http://localhost:8025 |
| API | http://localhost:4000/api/health |

Submit an enquiry from any product page, then open Mailpit to see the email the sales team would receive.

To choose the 5 "top rated" products shown on the home page, set the ids before starting:

```bash
FEATURED_PRODUCT_IDS=2,4,6,8,10 docker compose up --build
```

## Run without Docker (for development)

Requires Node 20+. Email needs an SMTP server on `localhost:1025`; the easiest option is `docker run -p 1025:1025 -p 8025:8025 axllent/mailpit`.

```bash
# terminal 1
cd backend && cp .env.example .env && npm install && npm run dev

# terminal 2
cd frontend && npm install && npm run dev   # http://localhost:5173 (proxies /api to :4000)
```

## Tests

```bash
cd backend && npm test    # domain rules, data-source adapter + cache, HTTP API incl. enquiry/email
cd frontend && npm test   # each acceptance criterion through the real pages, with fetch mocked
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/products/featured` | The 5 featured ("top rated") products |
| GET | `/api/categories` | Category names |
| GET | `/api/categories/:name` | `{ category, topRated, others }` |
| GET | `/api/products?q=term` | Search on title, description and category |
| GET | `/api/products/:id` | Product details |
| POST | `/api/enquiries` | `{ productId, name, email, phone?, message? }`, which emails the sales inbox |

## Structure

```
backend/src
  catalogue/   Product model, ProductSource interface, Fake Store adapter, cache decorator, CatalogueService
  enquiry/     Enquiry validation, EmailSender interface, SMTP implementation
  http/        Express app: routing, validation, error mapping (no business logic)
  config/      Env parsing with fail-fast validation
  server.ts    Composition root: the one place concrete implementations are chosen
frontend/src
  api/         Typed API client (the only code that knows URLs)
  components/  Layout + search, product grid, enquiry form
  pages/       Home, Category, Search, Product
```

Configuration is documented in [`backend/.env.example`](backend/.env.example). No secrets are committed.
