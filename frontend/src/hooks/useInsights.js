import { useQuery } from '@tanstack/react-query';

import { fetchInsights, fetchFilterOptions, fetchStats } from '../api/insights.js';

/**
 * Data-fetching hooks (TanStack Query). The active filters are part of each query key,
 * so charts and lists refetch automatically whenever filters change, and identical
 * filter states are served from cache.
 */

/** Distinct filter options (static-ish; cached long). */
export function useFilterOptions() {
  return useQuery({
    queryKey: ['filterOptions'],
    queryFn: fetchFilterOptions,
    staleTime: 1000 * 60 * 10,
  });
}

/** Paginated insight list for the given filters + page. */
export function useInsightsList(filters, page, pageSize) {
  return useQuery({
    queryKey: ['insights', filters, page, pageSize],
    queryFn: () => fetchInsights(filters, { page, pageSize }),
    placeholderData: (prev) => prev, // keep previous page visible while fetching
  });
}

/** Pre-aggregated chart stats for the given filters. */
export function useStats(filters) {
  return useQuery({
    queryKey: ['stats', filters],
    queryFn: () => fetchStats(filters),
  });
}
