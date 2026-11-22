import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { CatalogueService } from '../catalogue/catalogueService.js';
import { UpstreamError } from '../catalogue/fakeStoreSource.js';
import { enquirySchema, ProductNotFoundError, type EnquiryService } from '../enquiry/enquiryService.js';

export interface AppDeps {
  catalogue: CatalogueService;
  enquiries: EnquiryService;
  corsOrigin: string;
  enquiryRateLimit?: number;
}

type Handler = (req: Request, res: Response) => Promise<void>;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

export function createApp({ catalogue, enquiries, corsOrigin, enquiryRateLimit = 10 }: AppDeps) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  // Minimal CORS for the dev server; in docker the client is served same-origin via nginx.
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') return void res.sendStatus(204);
    next();
  });

  const api = express.Router();

  api.get('/health', (_req, res) => void res.json({ status: 'ok' }));

  api.get('/products/featured', wrap(async (_req, res) => void res.json(await catalogue.featured())));

  api.get(
    '/products',
    wrap(async (req, res) => {
      const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
      if (!q) return void res.status(400).json({ error: 'Query parameter "q" is required' });
      res.json(await catalogue.search(q));
    }),
  );

  api.get(
    '/products/:id',
    wrap(async (req, res) => {
      const product = await catalogue.product(req.params.id);
      if (!product) return void res.status(404).json({ error: 'Product not found' });
      res.json(product);
    }),
  );

  api.get('/categories', wrap(async (_req, res) => void res.json(await catalogue.categories())));

  api.get(
    '/categories/:name',
    wrap(async (req, res) => {
      const view = await catalogue.category(req.params.name);
      if (!view) return void res.status(404).json({ error: 'Category not found' });
      res.json(view);
    }),
  );

  api.post(
    '/enquiries',
    rateLimit({ windowMs: 60_000, limit: enquiryRateLimit, standardHeaders: true, legacyHeaders: false }),
    wrap(async (req, res) => {
      const parsed = enquirySchema.safeParse(req.body);
      if (!parsed.success) {
        return void res.status(400).json({
          error: 'Invalid enquiry',
          fields: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])),
        });
      }
      await enquiries.submit(parsed.data);
      res.status(201).json({ message: 'Thank you, our sales team will be in touch shortly.' });
    }),
  );

  app.use('/api', api);
  app.use((_req, res) => void res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ProductNotFoundError) return void res.status(404).json({ error: 'Product not found' });
    if (err instanceof UpstreamError) {
      console.error(err.message);
      return void res.status(502).json({ error: 'Product catalogue is temporarily unavailable' });
    }
    if ((err as { type?: string }).type === 'entity.parse.failed') return void res.status(400).json({ error: 'Malformed JSON' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' }); // never leak internals
  });

  return app;
}
