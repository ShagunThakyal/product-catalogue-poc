import { useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAsync } from '../api/useAsync';

export function SearchBar() {
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get('q') ?? '');
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form role="search" onSubmit={onSubmit} className="search">
      <input aria-label="Search products" placeholder="Search products" value={term} onChange={(e) => setTerm(e.target.value)} />
      <button type="submit">Search</button>
    </form>
  );
}

export function Layout() {
  const categories = useAsync(() => api.categories(), []);
  return (
    <>
      <header className="header">
        <Link to="/" className="brand">Catalogue</Link>
        <SearchBar />
      </header>
      <nav className="cats" aria-label="Categories">
        {categories.status === 'ok' &&
          categories.data.map((c) => (
            <NavLink key={c} to={`/category/${encodeURIComponent(c)}`}>
              {c}
            </NavLink>
          ))}
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </>
  );
}
