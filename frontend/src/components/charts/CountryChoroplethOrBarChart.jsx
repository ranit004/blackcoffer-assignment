import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import { useChartSize } from './shared/useChartSize.js';
import { useTooltip } from './shared/useTooltip.js';
import { Tooltip } from './shared/Tooltip.jsx';
import { sequentialBlue, AXIS_COLOR, TEXT_COLOR } from './shared/palette.js';

/**
 * CHOICE: horizontal bar chart of the top-15 countries by insight count, with bars
 * colored by average intensity (sequential blue).
 *
 * Why bar, not choropleth: a proper choropleth needs (a) a world TopoJSON shipped/fetched
 * and (b) reliable joins between this dataset's free-text country names (e.g.
 * "United States of America", "Russia") and the TopoJSON's ISO names — a brittle,
 * error-prone mapping that would silently drop unmatched countries. A ranked bar chart
 * conveys the same "which countries dominate + how intense" insight accurately with no
 * name-matching risk, so it is the more honest visual for this free-text data.
 *
 * @param {object} props
 * @param {Array<{country:string,count:number,avgIntensity:number}>} props.data
 * @param {(country:string) => void} [props.onSelect]
 * @param {string[]} [props.selected]
 */
export function CountryChoroplethOrBarChart({ data = [], onSelect, selected = [] }) {
  const [ref, width] = useChartSize();
  const svgRef = useRef(null);
  const { tooltip, show, hide } = useTooltip();

  const BAR_H = 20;
  const MARGIN = { top: 8, right: 40, bottom: 20, left: 140 };
  const height = data.length * (BAR_H + 6) + MARGIN.top + MARGIN.bottom;

  useEffect(() => {
    if (!width || !data.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count)])
      .nice()
      .range([0, innerW]);
    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.country))
      .range([0, innerH])
      .padding(0.2);
    const intensityExtent = d3.extent(data, (d) => d.avgIntensity ?? 0);
    const color = sequentialBlue([intensityExtent[0] || 0, intensityExtent[1] || 1]);

    g.append('g')
      .attr('color', AXIS_COLOR)
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', TEXT_COLOR);

    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('y', (d) => y(d.country))
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d.count))
      .attr('rx', 3)
      .attr('fill', (d) => color(d.avgIntensity ?? 0))
      .attr('stroke', (d) => (selected.includes(d.country) ? '#111827' : 'none'))
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mousemove', (event, d) =>
        show(
          event,
          `<strong>${d.country}</strong><br/>${d.count} insights<br/>Avg intensity: ${d.avgIntensity ?? '—'}<br/><em>click to filter</em>`,
        ),
      )
      .on('mouseleave', hide)
      .on('click', (_event, d) => onSelect?.(d.country));

    g.selectAll('.val')
      .data(data)
      .join('text')
      .attr('class', 'val')
      .attr('x', (d) => x(d.count) + 4)
      .attr('y', (d) => y(d.country) + y.bandwidth() / 2 + 3)
      .style('font-size', '10px')
      .style('fill', TEXT_COLOR)
      .text((d) => d.count);
  }, [
    data,
    width,
    height,
    selected,
    onSelect,
    show,
    hide,
    MARGIN.left,
    MARGIN.right,
    MARGIN.top,
    MARGIN.bottom,
  ]);

  return (
    <div ref={ref}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label="Top countries by insight count, colored by average intensity"
      />
      <Tooltip tooltip={tooltip} />
    </div>
  );
}

export default CountryChoroplethOrBarChart;
