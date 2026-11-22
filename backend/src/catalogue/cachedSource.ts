import type { Product, ProductSource } from './product.js';

/**
 * Decorator that keeps the last good catalogue in memory for `ttlMs`.
 * Fake Store data is static and slow-ish, and every page needs the full list, so this keeps
 * the PoC fast without coupling caching into the source itself. Swap for Redis/CDN later.
 */
export class CachedSource implements ProductSource {
  private products?: { at: number; value: Promise<Product[]> };
  private categories?: { at: number; value: Promise<string[]> };

  constructor(
    private readonly inner: ProductSource,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  listProducts(): Promise<Product[]> {
    if (!this.products || this.now() - this.products.at > this.ttlMs) {
      const value = this.inner.listProducts();
      this.products = { at: this.now(), value };
      value.catch(() => (this.products = undefined)); // never cache a failure
    }
    return this.products.value;
  }

  listCategories(): Promise<string[]> {
    if (!this.categories || this.now() - this.categories.at > this.ttlMs) {
      const value = this.inner.listCategories();
      this.categories = { at: this.now(), value };
      value.catch(() => (this.categories = undefined));
    }
    return this.categories.value;
  }
}
