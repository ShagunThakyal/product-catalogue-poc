import type { Product, ProductSource } from './product.js';

export interface CatalogueOptions {
  /** Product ids the business has hand-picked as "top rated". Empty = fall back to highest rated. */
  featuredIds: string[];
  featuredCount: number;
  /** How many products per category are shown in the "top rated" strip. */
  categoryTopCount: number;
}

export interface CategoryView {
  category: string;
  topRated: Product[];
  others: Product[];
}

const byRating = (a: Product, b: Product) => b.rating.rate - a.rating.rate || b.rating.count - a.rating.count;

/** Business rules for browsing. Knows nothing about HTTP or about where products come from. */
export class CatalogueService {
  constructor(
    private readonly source: ProductSource,
    private readonly opts: CatalogueOptions,
  ) {}

  async featured(): Promise<Product[]> {
    const all = await this.source.listProducts();
    if (this.opts.featuredIds.length) {
      const byId = new Map(all.map((p) => [p.id, p]));
      // keep the merchandiser's order; silently drop ids that no longer exist
      const picked = this.opts.featuredIds.map((id) => byId.get(id)).filter((p): p is Product => !!p);
      if (picked.length) return picked.slice(0, this.opts.featuredCount);
    }
    return [...all].sort(byRating).slice(0, this.opts.featuredCount);
  }

  categories(): Promise<string[]> {
    return this.source.listCategories();
  }

  async category(name: string): Promise<CategoryView | null> {
    const all = await this.source.listProducts();
    const inCategory = all.filter((p) => p.category.toLowerCase() === name.toLowerCase());
    if (!inCategory.length) return null;
    const sorted = [...inCategory].sort(byRating);
    return {
      category: inCategory[0].category,
      topRated: sorted.slice(0, this.opts.categoryTopCount),
      others: sorted.slice(this.opts.categoryTopCount),
    };
  }

  /** Case-insensitive match on title, description or category; every word must match. */
  async search(term: string): Promise<Product[]> {
    const words = term.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const all = await this.source.listProducts();
    return all.filter((p) => {
      const haystack = `${p.title} ${p.description} ${p.category}`.toLowerCase();
      return words.every((w) => haystack.includes(w));
    });
  }

  async product(id: string): Promise<Product | null> {
    const all = await this.source.listProducts();
    return all.find((p) => p.id === id) ?? null;
  }
}
