import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import { useChartSize } from './shared/useChartSize.js';
import { useTooltip } from './shared/useTooltip.js';
import { Tooltip } from './shared/Tooltip.jsx';
import { categorical, AXIS_COLOR, GRID_COLOR, TEXT_COLOR } from './shared/palette.js';

const HEIGHT = 300;
const MARGIN = { top: 16, right: 20, bottom: 40, left: 44 };

/**
 * The "creative insight" visual: a scatter plot of sector average intensity (x) vs
 * average likelihood (y), with bubble size = insight count. Sectors in the top-right
 * combine HIGH intensity AND HIGH likelihood — the most consequential, most probable
 * themes — which a single-metric bar chart can't reveal.
 *
 * @param {object} props
 * @param {Array<{sector:string,avgIntensity:number,avgLikelihood:number,count:number}>} props.data
 */
export function SectorRadialOrScatter({ data = [] }) {
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

    const x = d3
      .scaleLinear()
      .domain([0, (d3.max(data, (d) => d.avgIntensity) || 1) * 1.1])
      .nice()
      .range([0, innerW]);
    const y = d3
      .scaleLinear()
      .domain([0, (d3.max(data, (d) => d.avgLikelihood) || 1) * 1.1])
      .nice()
      .range([innerH, 0]);
    const r = d3
      .scaleSqrt()
      .domain([0, d3.max(data, (d) => d.count) || 1])
      .range([4, 26]);

    // Gridlines
    g.append('g')
      .attr('color', GRID_COLOR)
      .call(d3.axisLeft(y).ticks(4).tickSize(-innerW).tickFormat(''))
      .select('.domain')
      .remove();

    // Axes + labels
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .attr('color', AXIS_COLOR)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', TEXT_COLOR);
    g.append('g')
      .attr('color', AXIS_COLOR)
      .call(d3.axisLeft(y).ticks(4))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', TEXT_COLOR);

    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 32)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', TEXT_COLOR)
      .text('Avg intensity →');
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -32)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', TEXT_COLOR)
      .text('Avg likelihood →');

    g.selectAll('.bubble')
      .data(data)
      .join('circle')
      .attr('class', 'bubble')
      .attr('cx', (d) => x(d.avgIntensity))
      .attr('cy', (d) => y(d.avgLikelihood))
      .attr('r', (d) => r(d.count))
      .attr('fill', (_d, i) => categorical(i))
      .attr('fill-opacity', 0.65)
      .attr('stroke', (_d, i) => categorical(i))
      .style('cursor', 'pointer')
      .on('mousemove', (event, d) =>
        show(
          event,
          `<strong>${d.sector}</strong><br/>Avg intensity: ${d.avgIntensity ?? '—'}<br/>Avg likelihood: ${d.avgLikelihood ?? '—'}<br/>${d.count} insights`,
        ),
      )
      .on('mouseleave', hide);
  }, [data, width, show, hide]);

  return (
    <div ref={ref}>
      <svg
        ref={svgRef}
        width={width}
        height={HEIGHT}
        role="img"
        aria-label="Sector average intensity vs likelihood, bubble size by count"
      />
      <Tooltip tooltip={tooltip} />
    </div>
  );
}

export default SectorRadialOrScatter;
