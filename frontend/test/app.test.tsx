import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { App } from '../src/App';
import type { Product } from '../src/api/client';

const p = (id: string, title: string, category = 'electronics'): Product => ({
  id,
  title,
  description: `About ${title}`,
  price: 20,
  category,
  imageUrl: `https://img/${id}.png`,
  rating: { rate: 4.5, count: 3 },
});

const featured = ['1', '2', '3', '4', '5'].map((id) => p(id, `Featured ${id}`));

/** Fake backend: routes fetch calls by URL so tests exercise the real client + pages. */
function mockApi(overrides: Record<string, (init?: RequestInit) => [number, unknown]> = {}) {
  const routes: Record<string, (init?: RequestInit) => [number, unknown]> = {
    '/api/categories': () => [200, ['electronics', 'jewelery']],
    '/api/products/featured': () => [200, featured],
    '/api/categories/jewelery': () => [200, { category: 'jewelery', topRated: [p('9', 'Gold Ring', 'jewelery')], others: [p('10', 'Silver Chain', 'jewelery')] }],
    '/api/products?q=ring': () => [200, [p('9', 'Gold Ring', 'jewelery')]],
    '/api/products/9': () => [200, p('9', 'Gold Ring', 'jewelery')],
    '/api/enquiries': () => [201, { message: 'Thank you, our sales team will be in touch shortly.' }],
    ...overrides,
  };
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const handler = routes[String(input)];
    const [status, body] = handler ? handler(init) : [404, { error: 'Not found' }];
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  });
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('catalogue UI', () => {
  it('shows the 5 featured products on the home page', async () => {
    mockApi();
    renderAt('/');
    for (const f of featured) expect(await screen.findByRole('link', { name: f.title })).toBeInTheDocument();
  });

  it('shows top rated and additional products when a category link is clicked', async () => {
    mockApi();
    renderAt('/');
    await userEvent.click(await screen.findByRole('link', { name: 'jewelery' }));
    expect(await screen.findByRole('heading', { name: 'Top rated' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gold Ring' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Silver Chain' })).toBeInTheDocument();
  });

  it('searches when the search button is clicked', async () => {
    mockApi();
    renderAt('/');
    await userEvent.type(screen.getByRole('textbox', { name: 'Search products' }), 'ring');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('heading', { name: /results for/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Gold Ring' })).toBeInTheDocument();
  });

  it('opens product details from a tile, submits an enquiry and shows a thank-you message', async () => {
    const fetchSpy = mockApi();
    renderAt('/category/jewelery');
    await userEvent.click(await screen.findByRole('link', { name: 'Gold Ring' }));
    expect(await screen.findByRole('heading', { name: 'Gold Ring', level: 1 })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Enquire' }));
    await userEvent.type(screen.getByLabelText(/name/i), 'Asha');
    await userEvent.type(screen.getByLabelText(/email/i), 'asha@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('Thank you!')).toBeInTheDocument();
    const call = fetchSpy.mock.calls.find(([url]) => url === '/api/enquiries');
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({ productId: '9', name: 'Asha', email: 'asha@example.com' });
  });

  it('validates the enquiry form before sending', async () => {
    const fetchSpy = mockApi();
    renderAt('/products/9');
    await userEvent.click(await screen.findByRole('button', { name: 'Enquire' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('A valid email is required')).toBeInTheDocument();
    expect(fetchSpy.mock.calls.some(([url]) => url === '/api/enquiries')).toBe(false);
  });

  it('shows the server error if the enquiry fails', async () => {
    mockApi({ '/api/enquiries': () => [502, { error: 'Product catalogue is temporarily unavailable' }] });
    renderAt('/products/9');
    await userEvent.click(await screen.findByRole('button', { name: 'Enquire' }));
    await userEvent.type(screen.getByLabelText(/name/i), 'Asha');
    await userEvent.type(screen.getByLabelText(/email/i), 'asha@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');
  });
});
