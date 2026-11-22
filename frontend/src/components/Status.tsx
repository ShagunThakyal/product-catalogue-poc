import type { ReactNode } from 'react';
import type { AsyncState } from '../api/useAsync';

/** Renders loading / error states consistently so pages only handle the happy path. */
export function Status<T>({ state, children }: { state: AsyncState<T>; children: (data: T) => ReactNode }) {
  if (state.status === 'loading') return <p className="muted">Loading…</p>;
  if (state.status === 'error') return <p role="alert" className="error">{state.error}</p>;
  return <>{children(state.data)}</>;
}
