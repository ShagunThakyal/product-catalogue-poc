// Mirrors the backend's Product model. Only this module knows the API's URLs.
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: { rate: number; count: number };
}

export interface CategoryView {
  category: string;
  topRated: Product[];
  others: Product[];
}

export interface EnquiryInput {
  productId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError('Could not reach the server. Please try again.', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? 'Something went wrong', res.status, body.fields);
  return body as T;
}

export const api = {
  featured: () => request<Product[]>('/products/featured'),
  categories: () => request<string[]>('/categories'),
  category: (name: string) => request<CategoryView>(`/categories/${encodeURIComponent(name)}`),
  search: (q: string) => request<Product[]>(`/products?q=${encodeURIComponent(q)}`),
  product: (id: string) => request<Product>(`/products/${encodeURIComponent(id)}`),
  enquire: (input: EnquiryInput) =>
    request<{ message: string }>('/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
};
