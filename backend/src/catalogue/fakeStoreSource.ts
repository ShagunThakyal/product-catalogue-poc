import type { Product, ProductSource } from './product.js';

interface FakeStoreProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating?: { rate: number; count: number };
}

export class UpstreamError extends Error {}

/** Adapter for https://fakestoreapi.com. Maps their payload onto our Product model. */
export class FakeStoreSource implements ProductSource {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = 5000,
  ) {}

  async listProducts(): Promise<Product[]> {
    const raw = await this.get<FakeStoreProduct[]>('/products');
    return raw.map(toProduct);
  }

  async listCategories(): Promise<string[]> {
    return this.get<string[]>('/products/categories');
  }

  private async get<T>(path: string): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}${path}`, { signal: AbortSignal.timeout(this.timeoutMs) });
    } catch (err) {
      throw new UpstreamError(`Product source unreachable: ${(err as Error).message}`);
    }
    if (!res.ok) throw new UpstreamError(`Product source returned ${res.status}`);
    return (await res.json()) as T;
  }
}

export function toProduct(p: FakeStoreProduct): Product {
  return {
    id: String(p.id),
    title: p.title,
    description: p.description,
    price: p.price,
    category: p.category,
    imageUrl: p.image,
    rating: { rate: p.rating?.rate ?? 0, count: p.rating?.count ?? 0 },
  };
}
