import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../api/useAsync';
import { ProductGrid } from '../components/ProductGrid';
import { Status } from '../components/Status';
import { EnquiryForm } from '../components/EnquiryForm';

export function HomePage() {
  const featured = useAsync(() => api.featured(), []);
  return (
    <section>
      <h1>Top rated</h1>
      <Status state={featured}>{(products) => <ProductGrid products={products} />}</Status>
    </section>
  );
}

export function CategoryPage() {
  const { name = '' } = useParams();
  const view = useAsync(() => api.category(name), [name]);
  return (
    <Status state={view}>
      {(v) => (
        <>
          <h1 className="capitalize">{v.category}</h1>
          <h2>Top rated</h2>
          <ProductGrid products={v.topRated} />
          <h2>More in {v.category}</h2>
          <ProductGrid products={v.others} empty="No other products in this category." />
        </>
      )}
    </Status>
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const results = useAsync(() => (q.trim() ? api.search(q) : Promise.resolve([])), [q]);
  return (
    <section>
      <h1>Results for “{q}”</h1>
      <Status state={results}>{(products) => <ProductGrid products={products} empty={`No products match “${q}”.`} />}</Status>
    </section>
  );
}

export function ProductPage() {
  const { id = '' } = useParams();
  const product = useAsync(() => api.product(id), [id]);
  const [enquiring, setEnquiring] = useState(false);
  return (
    <Status state={product}>
      {(p) => (
        <article className="product">
          <img src={p.imageUrl} alt={p.title} />
          <div>
            <h1>{p.title}</h1>
            <p className="muted capitalize">{p.category}</p>
            <p className="price">${p.price.toFixed(2)}</p>
            <p>★ {p.rating.rate.toFixed(1)} ({p.rating.count} reviews)</p>
            <p>{p.description}</p>
            {enquiring ? <EnquiryForm product={p} onCancel={() => setEnquiring(false)} /> : <button onClick={() => setEnquiring(true)}>Enquire</button>}
          </div>
        </article>
      )}
    </Status>
  );
}

export function NotFoundPage() {
  return <h1>Page not found</h1>;
}
