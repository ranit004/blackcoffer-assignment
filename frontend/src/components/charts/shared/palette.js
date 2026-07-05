import * as d3 from 'd3';

/**
 * Shared chart palette + scale helpers, so all five charts read as one visual system.
 * Kept in one place (charts/shared) rather than duplicated per chart.
 */

// A distinct, reasonably color-blind-aware categorical palette.
export const CATEGORICAL = [
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#ea580c',
  '#4f46e5',
];

// Two series colors used consistently across charts (intensity vs likelihood).
export const SERIES = {
  intensity: '#2563eb',
  likelihood: '#f59e0b',
  relevance: '#16a34a',
};

/**
 * A sequential blue scale for a numeric domain (e.g. avg relevance / avg intensity).
 * @param {[number, number]} domain
 * @returns {(v: number) => string}
 */
export function sequentialBlue(domain) {
  return d3.scaleSequential(d3.interpolateBlues).domain(domain);
}

/**
 * Ordinal color from the categorical palette by index.
 * @param {number} i
 * @returns {string}
 */
export function categorical(i) {
  return CATEGORICAL[i % CATEGORICAL.length];
}

export const AXIS_COLOR = '#9ca3af';
export const GRID_COLOR = '#e5e7eb';
export const TEXT_COLOR = '#374151';
