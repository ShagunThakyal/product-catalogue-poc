import { z } from 'zod';

const csv = z
  .string()
  .default('')
  .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean));

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  PRODUCT_API_BASE_URL: z.string().url().default('https://fakestoreapi.com'),
  CATALOGUE_CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
  FEATURED_PRODUCT_IDS: csv,
  CATEGORY_TOP_RATED_COUNT: z.coerce.number().int().positive().default(3),
  SALES_INBOX: z.string().email().default('sales@example.com'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Catalogue <no-reply@example.com>'),
});

export type Config = z.infer<typeof schema>;

/** Fail fast on bad configuration instead of failing on the first request. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid configuration: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  return parsed.data;
}
