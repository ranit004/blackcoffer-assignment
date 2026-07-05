import { useState } from 'react';

import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.js';
import styles from './filters.module.css';

/**
 * Dual-thumb min/max range slider. Local state updates immediately (smooth dragging);
 * the committed value is debounced (300ms) before it reaches the URL/API so dragging
 * doesn't spam requests.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {number} props.min
 * @param {number} props.max
 * @param {number|''} props.valueMin - current committed min ('' = unset).
 * @param {number|''} props.valueMax - current committed max ('' = unset).
 * @param {(min: number|'', max: number|'') => void} props.onChange - debounced upstream.
 */
export function FilterRangeSlider({ label, min, max, valueMin, valueMax, onChange }) {
  const [lo, setLo] = useState(valueMin === '' ? min : valueMin);
  const [hi, setHi] = useState(valueMax === '' ? max : valueMax);

  // Reset local thumbs when the committed values or bounds change externally (e.g. Clear
  // All). This is the React-recommended "adjust state during render" pattern — no effect,
  // no cascading-render lint warning.
  const [prev, setPrev] = useState({ valueMin, valueMax, min, max });
  if (
    prev.valueMin !== valueMin ||
    prev.valueMax !== valueMax ||
    prev.min !== min ||
    prev.max !== max
  ) {
    setPrev({ valueMin, valueMax, min, max });
    setLo(valueMin === '' ? min : valueMin);
    setHi(valueMax === '' ? max : valueMax);
  }

  const debouncedCommit = useDebouncedCallback((nextLo, nextHi) => {
    // Send '' when a bound is at its extreme so the filter is treated as "unset".
    onChange(nextLo <= min ? '' : nextLo, nextHi >= max ? '' : nextHi);
  }, 300);

  const handleLo = (v) => {
    const next = Math.min(Number(v), hi);
    setLo(next);
    debouncedCommit(next, hi);
  };
  const handleHi = (v) => {
    const next = Math.max(Number(v), lo);
    setHi(next);
    debouncedCommit(lo, next);
  };

  return (
    <div className={styles.control}>
      <div className={styles.label}>
        <span>{label}</span>
      </div>
      <div className={styles.rangeValues}>
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
      <div className={styles.rangeWrap}>
        <div className={styles.rangeTrack} />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={(e) => handleLo(e.target.value)}
          aria-label={`${label} minimum`}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) => handleHi(e.target.value)}
          aria-label={`${label} maximum`}
        />
      </div>
    </div>
  );
}

export default FilterRangeSlider;
