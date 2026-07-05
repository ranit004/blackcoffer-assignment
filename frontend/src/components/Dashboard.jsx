import { useState } from 'react';

import { useFilters } from '../hooks/useFilters.js';
import { useInsightsList } from '../hooks/useInsights.js';
import { FilterBar } from './filters/FilterBar.jsx';
import { EmptyState } from './common/EmptyState.jsx';
import { ChartsGrid } from './ChartsGrid.jsx';
import styles from './Dashboard.module.css';

/**
 * The top-level dashboard layout: header, a collapsible filter sidebar (a slide-over on
 * screens under 768px), and the main content area (KPIs + charts, or loading/empty
 * states). Filter state lives in the URL via useFilters, so charts refetch on change.
 */
export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { filters, clearAll } = useFilters();

  // A tiny query (page_size 1) purely to read `total` for the summary + empty state.
  const { data, isLoading, isError } = useInsightsList(filters, 1, 1);
  const total = data?.total ?? 0;
  const noResults = !isLoading && !isError && total === 0;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle filters"
          aria-expanded={sidebarOpen}
        >
          ☰ Filters
        </button>
        <h1 className={styles.title}>Blackcoffer Insights Dashboard</h1>
        <span className={styles.count} data-testid="insights-count">
          {isLoading ? 'Loading…' : `${total.toLocaleString()} insights`}
        </span>
      </header>

      <div className={styles.body}>
        {/* Backdrop for the mobile slide-over */}
        {sidebarOpen && (
          <div
            className={styles.backdrop}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <FilterBar />
        </aside>

        <main className={styles.main}>
          {isError ? (
            <EmptyState message="Could not reach the API. Make sure the backend is running on :8000." />
          ) : noResults ? (
            <EmptyState onClear={clearAll} />
          ) : (
            <ChartsGrid filters={filters} total={total} listLoading={isLoading} />
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
