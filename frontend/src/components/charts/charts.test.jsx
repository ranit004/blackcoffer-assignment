import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ChartCard } from './shared/ChartCard.jsx';
import { IntensityLikelihoodTrendChart } from './IntensityLikelihoodTrendChart.jsx';
import { RegionBarChart } from './RegionBarChart.jsx';
import { TopicTreemap } from './TopicTreemap.jsx';
import { CountryChoroplethOrBarChart } from './CountryChoroplethOrBarChart.jsx';
import { SectorRadialOrScatter } from './SectorRadialOrScatter.jsx';

const SAMPLE = {
  byYear: [
    { year: 2017, avgIntensity: 12.7, avgLikelihood: 3.3, avgRelevance: 3, count: 3 },
    { year: 2018, avgIntensity: 11, avgLikelihood: 3, avgRelevance: 3.5, count: 2 },
  ],
  byRegion: [
    { region: 'World', count: 4 },
    { region: 'Northern America', count: 2 },
  ],
  byTopic: [
    { topic: 'oil', count: 3, avgRelevance: 4 },
    { topic: 'market', count: 2, avgRelevance: 3 },
  ],
  byCountry: [
    { country: 'United States of America', count: 2, avgIntensity: 8 },
    { country: 'India', count: 1, avgIntensity: 16 },
  ],
  bySector: [
    { sector: 'Information Technology', avgIntensity: 24, avgLikelihood: 4, count: 1 },
    { sector: 'Energy', avgIntensity: 12, avgLikelihood: 3.3, count: 4 },
  ],
};

describe('chart components render without crashing given data', () => {
  it('IntensityLikelihoodTrendChart renders an SVG', () => {
    const { container } = render(<IntensityLikelihoodTrendChart data={SAMPLE.byYear} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('RegionBarChart renders an SVG', () => {
    const { container } = render(<RegionBarChart data={SAMPLE.byRegion} onSelect={() => {}} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('TopicTreemap renders an SVG', () => {
    const { container } = render(<TopicTreemap data={SAMPLE.byTopic} onSelect={() => {}} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('CountryChoroplethOrBarChart renders an SVG', () => {
    const { container } = render(
      <CountryChoroplethOrBarChart data={SAMPLE.byCountry} onSelect={() => {}} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('SectorRadialOrScatter renders an SVG', () => {
    const { container } = render(<SectorRadialOrScatter data={SAMPLE.bySector} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('charts render with EMPTY data without crashing', () => {
    expect(() => render(<RegionBarChart data={[]} onSelect={() => {}} />)).not.toThrow();
    expect(() => render(<SectorRadialOrScatter data={[]} />)).not.toThrow();
  });
});

describe('ChartCard states', () => {
  it('shows the empty-state message when isEmpty', () => {
    render(
      <ChartCard title="Test" isEmpty>
        <div>should not render</div>
      </ChartCard>,
    );
    expect(screen.getByText(/No data for the current filters/i)).toBeInTheDocument();
    expect(screen.queryByText('should not render')).not.toBeInTheDocument();
  });

  it('renders children and caption when it has data', () => {
    render(
      <ChartCard title="Test" caption="Energy leads.">
        <div>chart body</div>
      </ChartCard>,
    );
    expect(screen.getByText('chart body')).toBeInTheDocument();
    expect(screen.getByText('Energy leads.')).toBeInTheDocument();
  });
});
