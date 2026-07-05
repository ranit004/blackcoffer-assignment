import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import { useChartSize } from './shared/useChartSize.js';
import { useTooltip } from './shared/useTooltip.js';
import { Tooltip } from './shared/Tooltip.jsx';
import { AXIS_COLOR, TEXT_COLOR } from './shared/palette.js';

const BAR_H = 22;
const MARGIN = { top: 8, right: 40, bottom: 20, left: 120 };

/**
 * Horizontal bar chart of insight count by region, sorted descending. Clicking a bar
 * toggles that region in the active filters (click-to-filter).
 *
 * @param {object} props
 * @param {Array<{region:string,count:number}>} props.data
 * @param {(region:string) => void} props.onSelect
 * @param {string[]} props.selected - currently active regions (for highlight).
 */
export function RegionBarChart({ data = [], onSelect, selected = [] }) {
  const [ref, width] = useChartSize();
  const svgRef = useRef(null);
  const { tooltip, show, hide } = useTooltip();

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
      .domain(data.map((d) => d.region))
      .range([0, innerH])
      .padding(0.2);

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
      .attr('x', 0)
      .attr('y', (d) => y(d.region))
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d.count))
      .attr('rx', 3)
      .attr('fill', (d) => (selected.includes(d.region) ? '#1d4ed8' : '#60a5fa'))
      .style('cursor', 'pointer')
      .on('mousemove', (event, d) =>
        show(
          event,
          `<strong>${d.region}</strong><br/>${d.count} insights<br/><em>click to filter</em>`,
        ),
      )
      .on('mouseleave', hide)
      .on('click', (_event, d) => onSelect?.(d.region));

    g.selectAll('.val')
      .data(data)
      .join('text')
      .attr('class', 'val')
      .attr('x', (d) => x(d.count) + 4)
      .attr('y', (d) => y(d.region) + y.bandwidth() / 2 + 3)
      .style('font-size', '10px')
      .style('fill', TEXT_COLOR)
      .text((d) => d.count);
  }, [data, width, height, selected, onSelect, show, hide]);

  return (
    <div ref={ref}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label="Insight count by region"
      />
      <Tooltip tooltip={tooltip} />
    </div>
  );
}

export default RegionBarChart;
