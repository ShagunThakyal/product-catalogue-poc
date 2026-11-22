import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/http/app.js';
import { CatalogueService } from '../src/catalogue/catalogueService.js';
import { UpstreamError } from '../src/catalogue/fakeStoreSource.js';
import { EnquiryService, type OutgoingEmail } from '../src/enquiry/enquiryService.js';
import { StubSource } from './fixtures.js';

function setup(source = new StubSource()) {
  const sent: OutgoingEmail[] = [];
  const mailer = { send: vi.fn(async (e: OutgoingEmail) => void sent.push(e)) };
  const catalogue = new CatalogueService(source, { featuredIds: [], featuredCount: 5, categoryTopCount: 2 });
  const enquiries = new EnquiryService(catalogue, mailer, 'sales@shop.test');
  const app = createApp({ catalogue, enquiries, corsOrigin: 'http://localhost:5173', enquiryRateLimit: 3 });
  return { app, sent, mailer };
}

const validEnquiry = { productId: '1', name: 'Asha', email: 'asha@example.com', phone: '+91 98765 43210', message: 'Is it in stock?' };

describe('catalogue endpoints', () => {
  it('GET /api/products/featured returns 5 products', async () => {
    const res = await request(setup().app).get('/api/products/featured');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });

  it('GET /api/categories/:name returns top rated and other products', async () => {
    const res = await request(setup().app).get("/api/categories/men's%20clothing");
    expect(res.status).toBe(200);
    expect(res.body.topRated.map((p: { id: string }) => p.id)).toEqual(['7', '8']);
  });

  it('GET /api/products?q= searches and requires a term', async () => {
    const { app } = setup();
    expect((await request(app).get('/api/products?q=ring')).body.map((p: { id: string }) => p.id)).toEqual(['5']);
    expect((await request(app).get('/api/products?q=')).status).toBe(400);
  });

  it('GET /api/products/:id returns 404 for an unknown product', async () => {
    const { app } = setup();
    expect((await request(app).get('/api/products/3')).body.title).toBe('Monitor');
    expect((await request(app).get('/api/products/404')).status).toBe(404);
  });

  it('returns 502 without leaking details when the product source is down', async () => {
    const source = new StubSource();
    source.listProducts = async () => {
      throw new UpstreamError('connect ECONNREFUSED 10.0.0.1');
    };
    const res = await request(setup(source).app).get('/api/products/featured');
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain('10.0.0.1');
  });
});

describe('POST /api/enquiries', () => {
  it('emails the sales inbox and returns a thank-you message', async () => {
    const { app, sent } = setup();
    const res = await request(app).post('/api/enquiries').send(validEnquiry);
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/thank you/i);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: 'sales@shop.test', replyTo: 'asha@example.com', subject: 'Product enquiry: Wireless Headphones' });
    expect(sent[0].text).toContain('Is it in stock?');
  });

  it('rejects invalid input with field errors and sends nothing', async () => {
    const { app, mailer } = setup();
    const res = await request(app).post('/api/enquiries').send({ ...validEnquiry, email: 'not-an-email', name: '' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields)).toEqual(expect.arrayContaining(['email', 'name']));
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('returns 404 for an enquiry about a product that does not exist', async () => {
    const res = await request(setup().app).post('/api/enquiries').send({ ...validEnquiry, productId: '999' });
    expect(res.status).toBe(404);
  });

  it('rate limits repeated submissions', async () => {
    const { app } = setup();
    for (let i = 0; i < 3; i++) await request(app).post('/api/enquiries').send(validEnquiry);
    expect((await request(app).post('/api/enquiries').send(validEnquiry)).status).toBe(429);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(setup().app).post('/api/enquiries').set('content-type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });
});
