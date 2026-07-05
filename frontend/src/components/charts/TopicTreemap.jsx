import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import { useChartSize } from './shared/useChartSize.js';
import { useTooltip } from './shared/useTooltip.js';
import { Tooltip } from './shared/Tooltip.jsx';
import { sequentialBlue } from './shared/palette.js';

const HEIGHT = 300;

/**
 * D3 treemap: one rectangle per topic (top 15), sized by insight count and colored by
 * average relevance (sequential blue). Hover shows topic, count, and avg relevance.
 * Clicking a tile toggles that topic in the active filters.
 *
 * @param {object} props
 * @param {Array<{topic:string,count:number,avgRelevance:number}>} props.data
 * @param {(topic:string) => void} [props.onSelect]
 */
export function TopicTreemap({ data = [], onSelect }) {
  const [ref, width] = useChartSize();
  const svgRef = useRef(null);
  const { tooltip, show, hide } = useTooltip();

  useEffect(() => {
    if (!width || !data.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const root = d3
      .hierarchy({ children: data })
      .sum((d) => d.count)
      .sort((a, b) => b.value - a.value);

    d3.treemap().size([width, HEIGHT]).paddingInner(2).round(true)(root);

    const relExtent = d3.extent(data, (d) => d.avgRelevance ?? 0);
    const color = sequentialBlue([relExtent[0] || 0, relExtent[1] || 1]);

    const leaf = svg
      .selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer')
      .on('mousemove', (event, d) =>
        show(
          event,
          `<strong>${d.data.topic}</strong><br/>${d.data.count} insights<br/>Avg relevance: ${d.data.avgRelevance ?? '—'}`,
        ),
      )
      .on('mouseleave', hide)
      .on('click', (_event, d) => onSelect?.(d.data.topic));

    leaf
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('rx', 3)
      .attr('fill', (d) => color(d.data.avgRelevance ?? 0));

    leaf
      .append('text')
      .attr('x', 4)
      .attr('y', 14)
      .style('font-size', '11px')
      .style('font-weight', 600)
      .style('fill', (d) =>
        (d.data.avgRelevance ?? 0) > (relExtent[1] || 1) * 0.6 ? '#fff' : '#1f2937',
      )
      .style('pointer-events', 'none')
      .text((d) => {
        const w = d.x1 - d.x0;
        return w > 46 ? d.data.topic : '';
      });
  }, [data, width, onSelect, show, hide]);

  return (
    <div ref={ref}>
      <svg
        ref={svgRef}
        width={width}
        height={HEIGHT}
        role="img"
        aria-label="Topics sized by count, colored by average relevance"
      />
      <Tooltip tooltip={tooltip} />
    </div>
  );
}

export default TopicTreemap;
