import { describe, expect, it, vi } from 'vitest';
import { FakeStoreSource, UpstreamError } from '../src/catalogue/fakeStoreSource.js';
import { CachedSource } from '../src/catalogue/cachedSource.js';
import { StubSource } from './fixtures.js';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('FakeStoreSource', () => {
  it('maps the Fake Store payload onto our Product model', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse([{ id: 1, title: 'T', description: 'D', price: 9.5, category: 'c', image: 'http://i', rating: { rate: 4, count: 2 } }]),
    );
    const [p] = await new FakeStoreSource('http://api', fetchImpl).listProducts();
    expect(fetchImpl).toHaveBeenCalledWith('http://api/products', expect.anything());
    expect(p).toEqual({ id: '1', title: 'T', description: 'D', price: 9.5, category: 'c', imageUrl: 'http://i', rating: { rate: 4, count: 2 } });
  });

  it('turns HTTP and network failures into UpstreamError', async () => {
    await expect(new FakeStoreSource('http://api', vi.fn().mockResolvedValue(jsonResponse({}, 503))).listProducts()).rejects.toBeInstanceOf(
      UpstreamError,
    );
    await expect(new FakeStoreSource('http://api', vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))).listProducts()).rejects.toBeInstanceOf(
      UpstreamError,
    );
  });
});

describe('CachedSource', () => {
  it('serves from cache within the TTL and refreshes after it', async () => {
    let now = 0;
    const inner = new StubSource();
    const cached = new CachedSource(inner, 1000, () => now);
    await cached.listProducts();
    await cached.listProducts();
    expect(inner.calls).toBe(1);
    now = 1500;
    await cached.listProducts();
    expect(inner.calls).toBe(2);
  });

  it('does not cache failures', async () => {
    const inner = { listProducts: vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue([]), listCategories: vi.fn() };
    const cached = new CachedSource(inner, 60_000);
    await expect(cached.listProducts()).rejects.toThrow('down');
    await new Promise((r) => setTimeout(r, 0));
    await expect(cached.listProducts()).resolves.toEqual([]);
  });
});
