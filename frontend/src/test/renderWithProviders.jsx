import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { render } from '@testing-library/react';

/**
 * Renders a component inside the same providers used in production (React Query + Router)
 * with an in-memory router. Returns everything from RTL's render plus `getSearch()`,
 * which reads the current URL query string so tests can assert URL-synced filter state.
 *
 * @param {React.ReactNode} ui
 * @param {object} [options]
 * @param {string} [options.route='/'] - initial URL.
 */
export function renderWithProviders(ui, { route = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  let search = '';
  function LocationProbe() {
    search = useLocation().search;
    return null;
  }

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...utils, getSearch: () => search };
}

export default renderWithProviders;
