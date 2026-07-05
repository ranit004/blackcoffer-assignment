import { useFilters } from '../../hooks/useFilters.js';
import { useFilterOptions } from '../../hooks/useInsights.js';
import { FilterMultiSelect } from './FilterMultiSelect.jsx';
import { YearSelect } from './YearSelect.jsx';
import { FilterRangeSlider } from './FilterRangeSlider.jsx';
import { DisabledControl } from './DisabledControl.jsx';
import styles from './FilterBar.module.css';

const PESTLE_TOOLTIP =
  'Covers the assignment’s "PEST filter". The dataset provides PESTLE categories ' +
  '(Political, Economic, Social, Technological, Legal, Environmental, and a few others) — ' +
  'a superset of PEST.';

const CITY_TOOLTIP = 'No city-level data present in the source dataset.';

const SWOT_TOOLTIP =
  'The source data has no SWOT field — it only provides PESTLE categorization. ' +
  'Adding a fabricated SWOT classification would violate the "use given data only" ' +
  'requirement, so this control is shown but disabled.';

/**
 * The complete filter sidebar. All controls are populated dynamically from
 * /api/insights/filters and read/write shared filter state via useFilters (URL-synced).
 */
export function FilterBar() {
  const { filters, toggleMulti, setEndYear, setRange, clearAll, activeCount } = useFilters();
  const { data: options, isLoading, isError } = useFilterOptions();

  if (isLoading) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.skeletonList}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !options) {
    return (
      <div className={styles.sidebar}>
        <p className={styles.error}>Could not load filter options. Is the backend running?</p>
      </div>
    );
  }

  const sel = (field) => filters[field] ?? [];
  const ranges = options.ranges || {
    intensity: { min: 0, max: 100 },
    likelihood: { min: 0, max: 10 },
    relevance: { min: 0, max: 10 },
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Filters</h2>
        <button
          type="button"
          className={styles.clear}
          onClick={clearAll}
          disabled={activeCount === 0}
        >
          Clear all{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>

      <YearSelect years={options.end_year} value={filters.end_year ?? ''} onChange={setEndYear} />

      <FilterMultiSelect
        label="Topics"
        options={options.topic}
        selected={sel('topic')}
        onToggle={(v) => toggleMulti('topic', v)}
      />

      <FilterMultiSelect
        label="Sector"
        options={options.sector}
        selected={sel('sector')}
        onToggle={(v) => toggleMulti('sector', v)}
      />

      <FilterMultiSelect
        label="Region"
        options={options.region}
        selected={sel('region')}
        onToggle={(v) => toggleMulti('region', v)}
      />

      <FilterMultiSelect
        label="PESTLE Category"
        options={options.pestle}
        selected={sel('pestle')}
        onToggle={(v) => toggleMulti('pestle', v)}
        tooltip={PESTLE_TOOLTIP}
      />

      <FilterMultiSelect
        label="Source"
        options={options.source}
        selected={sel('source')}
        onToggle={(v) => toggleMulti('source', v)}
        searchable
      />

      <FilterMultiSelect
        label="Country"
        options={options.country}
        selected={sel('country')}
        onToggle={(v) => toggleMulti('country', v)}
        searchable
      />

      {options.city.length === 0 ? (
        <DisabledControl label="City" tooltip={CITY_TOOLTIP} />
      ) : (
        <FilterMultiSelect
          label="City"
          options={options.city}
          selected={sel('city')}
          onToggle={(v) => toggleMulti('city', v)}
          searchable
        />
      )}

      <DisabledControl label="SWOT" tooltip={SWOT_TOOLTIP} />

      <FilterRangeSlider
        label="Intensity"
        min={ranges.intensity.min}
        max={ranges.intensity.max}
        valueMin={filters.intensity_min ?? ''}
        valueMax={filters.intensity_max ?? ''}
        onChange={(min, max) => setRange('intensity', min, max)}
      />

      <FilterRangeSlider
        label="Likelihood"
        min={ranges.likelihood.min}
        max={ranges.likelihood.max}
        valueMin={filters.likelihood_min ?? ''}
        valueMax={filters.likelihood_max ?? ''}
        onChange={(min, max) => setRange('likelihood', min, max)}
      />

      <FilterRangeSlider
        label="Relevance"
        min={ranges.relevance.min}
        max={ranges.relevance.max}
        valueMin={filters.relevance_min ?? ''}
        valueMax={filters.relevance_max ?? ''}
        onChange={(min, max) => setRange('relevance', min, max)}
      />
    </div>
  );
}

export default FilterBar;
