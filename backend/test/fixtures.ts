import type { Product, ProductSource } from '../src/catalogue/product.js';

export const product = (id: string, category: string, rate: number, extra: Partial<Product> = {}): Product => ({
  id,
  title: `Product ${id}`,
  description: `Description ${id}`,
  price: 10,
  category,
  imageUrl: `https://img/${id}.jpg`,
  rating: { rate, count: 10 },
  ...extra,
});

export const PRODUCTS: Product[] = [
  product('1', 'electronics', 4.8, { title: 'Wireless Headphones' }),
  product('2', 'electronics', 3.1, { title: 'USB Cable' }),
  product('3', 'electronics', 4.2, { title: 'Monitor', description: 'A bright 27 inch display' }),
  product('4', 'electronics', 2.5),
  product('5', 'jewelery', 4.9, { title: 'Gold Ring' }),
  product('6', 'jewelery', 1.9),
  product('7', "men's clothing", 4.1, { title: 'Cotton Jacket' }),
  product('8', "men's clothing", 3.9),
];

export class StubSource implements ProductSource {
  calls = 0;
  constructor(private readonly products: Product[] = PRODUCTS) {}
  async listProducts() {
    this.calls++;
    return this.products;
  }
  async listCategories() {
    return [...new Set(this.products.map((p) => p.category))];
  }
}
