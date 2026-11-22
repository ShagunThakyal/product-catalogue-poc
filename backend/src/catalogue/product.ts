/**
 * Our own product model. The client and the rest of the backend only ever see this shape,
 * never the raw Fake Store payload, so swapping the data source does not ripple outwards.
 */
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: { rate: number; count: number };
}

/** Anything that can supply products: Fake Store today, a PIM / database / CMS later. */
export interface ProductSource {
  listProducts(): Promise<Product[]>;
  listCategories(): Promise<string[]>;
}
