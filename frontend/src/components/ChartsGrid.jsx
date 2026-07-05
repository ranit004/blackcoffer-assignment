import { useStats } from '../hooks/useInsights.js';
import { useFilters } from '../hooks/useFilters.js';
import { ChartCard } from './charts/shared/ChartCard.jsx';
import { computeCaptions } from './charts/shared/captions.js';
import { IntensityLikelihoodTrendChart } from './charts/IntensityLikelihoodTrendChart.jsx';
import { RegionBarChart } from './charts/RegionBarChart.jsx';
import { TopicTreemap } from './charts/TopicTreemap.jsx';
import { CountryChoroplethOrBarChart } from './charts/CountryChoroplethOrBarChart.jsx';
import { SectorRadialOrScatter } from './charts/SectorRadialOrScatter.jsx';
import styles from './ChartsGrid.module.css';

/**
 * KPI summary tiles + the five dashboard charts. All read from /api/insights/stats via
 * useStats(filters), so they refetch whenever filters change. Bar/treemap charts support
 * click-to-filter, mutating the shared URL-synced filter state.
 *
 * @param {object} props
 * @param {object} props.filters
 * @param {number} props.total
 */
export function ChartsGrid({ filters, total }) {
  const { data: stats, isLoading, isError } = useStats(filters);
  const { toggleMulti } = useFilters();

  const captions = computeCaptions(stats);
  const overall = stats?.overall;
  const empty = (arr) => !arr || arr.length === 0;

  const kpis = [
    { label: 'Insights', value: total?.toLocaleString() ?? '—' },
    { label: 'Avg intensity', value: overall?.avgIntensity ?? '—' },
    { label: 'Avg likelihood', value: overall?.avgLikelihood ?? '—' },
    { label: 'Avg relevance', value: overall?.avgRelevance ?? '—' },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.kpis}>
        {kpis.map((k) => (
          <div key={k.label} className={styles.kpi}>
            <span className={styles.kpiValue}>{isLoading ? '…' : k.value}</span>
            <span className={styles.kpiLabel}>{k.label}</span>
          </div>
        ))}
      </div>

      {isError && <p className={styles.error}>Could not load chart data.</p>}

      <div className={styles.grid}>
        <div className={styles.wide}>
          <ChartCard
            title="Intensity & Likelihood over Year"
            isLoading={isLoading}
            isEmpty={empty(stats?.byYear)}
            caption={captions.trend}
          >
            <IntensityLikelihoodTrendChart data={stats?.byYear || []} />
          </ChartCard>
        </div>

        <ChartCard
          title="Insights by Region"
          isLoading={isLoading}
          isEmpty={empty(stats?.byRegion)}
          caption={captions.region}
        >
          <RegionBarChart
            data={stats?.byRegion || []}
            selected={filters.region || []}
            onSelect={(region) => toggleMulti('region', region)}
          />
        </ChartCard>

        <ChartCard
          title="Top Topics (size = count, color = avg relevance)"
          isLoading={isLoading}
          isEmpty={empty(stats?.byTopic)}
          caption={captions.topic}
        >
          <TopicTreemap
            data={stats?.byTopic || []}
            onSelect={(topic) => toggleMulti('topic', topic)}
          />
        </ChartCard>

        <ChartCard
          title="Top Countries (color = avg intensity)"
          isLoading={isLoading}
          isEmpty={empty(stats?.byCountry)}
          caption={captions.country}
        >
          <CountryChoroplethOrBarChart
            data={stats?.byCountry || []}
            selected={filters.country || []}
            onSelect={(country) => toggleMulti('country', country)}
          />
        </ChartCard>

        <ChartCard
          title="Sector: Intensity vs Likelihood (size = count)"
          isLoading={isLoading}
          isEmpty={empty(stats?.bySector)}
          caption={captions.sector}
        >
          <SectorRadialOrScatter data={stats?.bySector || []} />
        </ChartCard>
      </div>
    </div>
  );
}

export default ChartsGrid;
