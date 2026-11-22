import { Link } from 'react-router-dom';
import type { Product } from '../api/client';

export function ProductTile({ product }: { product: Product }) {
  return (
    <Link to={`/products/${product.id}`} className="tile" aria-label={product.title}>
      <img src={product.imageUrl} alt="" loading="lazy" />
      <span className="tile-title">{product.title}</span>
      <span className="tile-meta">
        ${product.price.toFixed(2)} · ★ {product.rating.rate.toFixed(1)}
      </span>
    </Link>
  );
}

export function ProductGrid({ products, empty = 'No products found.' }: { products: Product[]; empty?: string }) {
  if (!products.length) return <p className="muted">{empty}</p>;
  return (
    <div className="grid">
      {products.map((p) => (
        <ProductTile key={p.id} product={p} />
      ))}
    </div>
  );
}
