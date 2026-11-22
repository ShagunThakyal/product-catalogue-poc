import { loadConfig } from './config/config.js';
import { FakeStoreSource } from './catalogue/fakeStoreSource.js';
import { CachedSource } from './catalogue/cachedSource.js';
import { CatalogueService } from './catalogue/catalogueService.js';
import { EnquiryService } from './enquiry/enquiryService.js';
import { SmtpEmailSender } from './enquiry/smtpEmailSender.js';
import { createApp } from './http/app.js';

// Composition root: the only place that knows which concrete implementations are in use.
const config = loadConfig();

const source = new CachedSource(new FakeStoreSource(config.PRODUCT_API_BASE_URL), config.CATALOGUE_CACHE_TTL_SECONDS * 1000);
const catalogue = new CatalogueService(source, {
  featuredIds: config.FEATURED_PRODUCT_IDS,
  featuredCount: 5,
  categoryTopCount: config.CATEGORY_TOP_RATED_COUNT,
});
const mailer = new SmtpEmailSender({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  user: config.SMTP_USER,
  pass: config.SMTP_PASS,
  from: config.MAIL_FROM,
});
const enquiries = new EnquiryService(catalogue, mailer, config.SALES_INBOX);

createApp({ catalogue, enquiries, corsOrigin: config.CORS_ORIGIN }).listen(config.PORT, () => {
  console.log(`API listening on http://localhost:${config.PORT}`);
});
