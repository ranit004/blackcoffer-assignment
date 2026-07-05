import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { MULTI_FIELDS, RANGE_FIELDS } from '../api/insights.js';

const RANGE_PARAM_KEYS = Object.values(RANGE_FIELDS).flat(); // intensity_min, intensity_max, ...

/**
 * useFilters — the app-wide filter state, backed entirely by the URL query string so any
 * filtered view is shareable/bookmarkable. All components read and write filters through
 * this hook; there is no separate store to keep in sync with the URL.
 *
 * @returns {{
 *   filters: object,
 *   toggleMulti: (field: string, value: string) => void,
 *   setMulti: (field: string, values: string[]) => void,
 *   setEndYear: (year: string) => void,
 *   setRange: (field: string, min: number|'', max: number|'') => void,
 *   clearAll: () => void,
 *   activeCount: number,
 * }}
 */
export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive a normalized filters object from the URL.
  const filters = useMemo(() => {
    const f = {};
    for (const field of MULTI_FIELDS) {
      const values = searchParams.getAll(field);
      if (values.length) f[field] = values;
    }
    const endYear = searchParams.get('end_year');
    if (endYear) f.end_year = endYear;
    for (const key of RANGE_PARAM_KEYS) {
      const v = searchParams.get(key);
      if (v !== null && v !== '') f[key] = Number(v);
    }
    return f;
  }, [searchParams]);

  // Helper: mutate the current params via a callback and commit.
  const commit = useCallback(
    (mutate) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const toggleMulti = useCallback(
    (field, value) => {
      commit((next) => {
        const current = next.getAll(field);
        next.delete(field);
        const set = new Set(current);
        if (set.has(value)) set.delete(value);
        else set.add(value);
        [...set].forEach((v) => next.append(field, v));
      });
    },
    [commit],
  );

  const setMulti = useCallback(
    (field, values) => {
      commit((next) => {
        next.delete(field);
        values.forEach((v) => next.append(field, v));
      });
    },
    [commit],
  );

  const setEndYear = useCallback(
    (year) => {
      commit((next) => {
        if (year) next.set('end_year', String(year));
        else next.delete('end_year');
      });
    },
    [commit],
  );

  const setRange = useCallback(
    (field, min, max) => {
      const [minKey, maxKey] = RANGE_FIELDS[field];
      commit((next) => {
        if (min === '' || min === null || min === undefined) next.delete(minKey);
        else next.set(minKey, String(min));
        if (max === '' || max === null || max === undefined) next.delete(maxKey);
        else next.set(maxKey, String(max));
      });
    },
    [commit],
  );

  const clearAll = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const activeCount = useMemo(() => {
    let count = 0;
    for (const field of MULTI_FIELDS) count += searchParams.getAll(field).length;
    if (searchParams.get('end_year')) count += 1;
    for (const key of RANGE_PARAM_KEYS) if (searchParams.get(key)) count += 1;
    return count;
  }, [searchParams]);

  return { filters, toggleMulti, setMulti, setEndYear, setRange, clearAll, activeCount };
}

export default useFilters;
