import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import { useChartSize } from './shared/useChartSize.js';
import { useTooltip } from './shared/useTooltip.js';
import { Tooltip } from './shared/Tooltip.jsx';
import { SERIES, AXIS_COLOR, GRID_COLOR, TEXT_COLOR } from './shared/palette.js';

const HEIGHT = 260;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 36 };

/**
 * Dual-line chart: average intensity and average likelihood over year, with a legend and
 * hover tooltips showing exact values. Re-renders cleanly on data/filter change (the SVG
 * is fully cleared and redrawn each pass — no element pile-up).
 *
 * @param {object} props
 * @param {Array<{year:number,avgIntensity:number,avgLikelihood:number,count:number}>} props.data
 */
export function IntensityLikelihoodTrendChart({ data = [] }) {
  const [ref, width] = useChartSize();
  const svgRef = useRef(null);
  const { tooltip, show, hide } = useTooltip();

  useEffect(() => {
    if (!width || !data.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const years = data.map((d) => d.year);
    const x = d3.scalePoint().domain(years).range([0, innerW]).padding(0.5);
    const maxY = d3.max(data, (d) => Math.max(d.avgIntensity ?? 0, d.avgLikelihood ?? 0)) || 1;
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([innerH, 0]);

    // Gridlines
    g.append('g')
      .attr('color', GRID_COLOR)
      .call(d3.axisLeft(y).ticks(4).tickSize(-innerW).tickFormat(''))
      .select('.domain')
      .remove();

    // Axes
    const tickYears = years.filter((_, i) => i % Math.ceil(years.length / 8 || 1) === 0);
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .attr('color', AXIS_COLOR)
      .call(d3.axisBottom(x).tickValues(tickYears))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', TEXT_COLOR);
    g.append('g')
      .attr('color', AXIS_COLOR)
      .call(d3.axisLeft(y).ticks(4))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', TEXT_COLOR);

    const series = [
      { key: 'avgIntensity', color: SERIES.intensity, label: 'Avg intensity' },
      { key: 'avgLikelihood', color: SERIES.likelihood, label: 'Avg likelihood' },
    ];

    for (const s of series) {
      const line = d3
        .line()
        .defined((d) => d[s.key] != null)
        .x((d) => x(d.year))
        .y((d) => y(d[s.key]));
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 2)
        .attr('d', line);

      g.selectAll(`.pt-${s.key}`)
        .data(data.filter((d) => d[s.key] != null))
        .join('circle')
        .attr('class', `pt-${s.key}`)
        .attr('cx', (d) => x(d.year))
        .attr('cy', (d) => y(d[s.key]))
        .attr('r', 3.5)
        .attr('fill', s.color)
        .style('cursor', 'pointer')
        .on('mousemove', (event, d) =>
          show(
            event,
            `<strong>${d.year}</strong><br/>Avg intensity: ${d.avgIntensity ?? '—'}<br/>Avg likelihood: ${d.avgLikelihood ?? '—'}<br/>${d.count} insights`,
          ),
        )
        .on('mouseleave', hide);
    }

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerW - 150},0)`);
    series.forEach((s, i) => {
      const row = legend.append('g').attr('transform', `translate(${i * 90},0)`);
      row.append('rect').attr('width', 10).attr('height', 10).attr('fill', s.color).attr('rx', 2);
      row
        .append('text')
        .attr('x', 14)
        .attr('y', 9)
        .style('font-size', '10px')
        .style('fill', TEXT_COLOR)
        .text(s.label);
    });
  }, [data, width, show, hide]);

  return (
    <div ref={ref}>
      <svg
        ref={svgRef}
        width={width}
        height={HEIGHT}
        role="img"
        aria-label="Intensity and likelihood trend by year"
      />
      <Tooltip tooltip={tooltip} />
    </div>
  );
}

export default IntensityLikelihoodTrendChart;
