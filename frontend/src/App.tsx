import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CategoryPage, HomePage, NotFoundPage, ProductPage, SearchPage } from './pages/pages';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="category/:name" element={<CategoryPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="products/:id" element={<ProductPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
