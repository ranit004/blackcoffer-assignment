import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test/renderWithProviders.jsx';

// Mock the API module: keep the real constants, stub the network functions.
vi.mock('../../api/insights.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchFilterOptions: vi.fn(),
    fetchInsights: vi.fn(),
    fetchStats: vi.fn(),
  };
});

import { fetchFilterOptions, fetchInsights } from '../../api/insights.js';
import { useFilters } from '../../hooks/useFilters.js';
import { useInsightsList } from '../../hooks/useInsights.js';
import { FilterBar } from './FilterBar.jsx';

const OPTIONS = {
  topic: ['gas', 'market', 'oil'],
  sector: ['Energy'],
  region: ['World'],
  pestle: ['Economic'],
  source: ['EIA'],
  country: ['India'],
  city: [],
  end_year: [2017, 2018],
  ranges: {
    intensity: { min: 1, max: 96 },
    likelihood: { min: 1, max: 4 },
    relevance: { min: 1, max: 7 },
  },
};

// Harness: FilterBar + a consumer that fetches insights, so filter changes trigger fetch.
function Harness() {
  const { filters } = useFilters();
  useInsightsList(filters, 1, 1);
  return <FilterBar />;
}

beforeEach(() => {
  fetchFilterOptions.mockResolvedValue(OPTIONS);
  fetchInsights.mockResolvedValue({ data: [], total: 0, page: 1, page_size: 1, total_pages: 0 });
});

describe('FilterBar', () => {
  it('selecting a topic updates the URL and triggers a new data fetch', async () => {
    const user = userEvent.setup();
    const { getSearch } = renderWithProviders(<Harness />);

    // Wait for options to load and render.
    const oil = await screen.findByRole('checkbox', { name: 'oil' });
    expect(oil).not.toBeChecked();

    await user.click(oil);

    // URL query string is updated (shareable/bookmarkable state).
    await waitFor(() => expect(getSearch()).toContain('topic=oil'));

    // A data fetch was triggered with the new filter.
    await waitFor(() =>
      expect(fetchInsights).toHaveBeenCalledWith(
        expect.objectContaining({ topic: ['oil'] }),
        expect.anything(),
      ),
    );
  });

  it('"Clear all" resets every control and clears the URL', async () => {
    const user = userEvent.setup();
    const { getSearch } = renderWithProviders(<Harness />, {
      route: '/?topic=oil&sector=Energy',
    });

    const oil = await screen.findByRole('checkbox', { name: 'oil' });
    expect(oil).toBeChecked();
    expect(getSearch()).toContain('topic=oil');

    await user.click(screen.getByRole('button', { name: /clear all/i }));

    await waitFor(() => expect(getSearch()).toBe(''));
    expect(screen.getByRole('checkbox', { name: 'oil' })).not.toBeChecked();
  });

  it('renders City and SWOT as disabled/explained controls (no data in source)', async () => {
    renderWithProviders(<Harness />);
    await screen.findByRole('checkbox', { name: 'oil' });
    expect(screen.getByText(/No city-level data present/i)).toBeInTheDocument();
    expect(screen.getByText(/no SWOT field/i)).toBeInTheDocument();
  });
});
