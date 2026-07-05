import { useMemo, useState } from 'react';

import styles from './filters.module.css';

/**
 * A labelled multi-select rendered as a scrollable checkbox list, with an optional
 * search box (used for the ~150+ country list). Single-purpose and controlled.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string[]} props.options
 * @param {string[]} props.selected
 * @param {(value: string) => void} props.onToggle
 * @param {boolean} [props.searchable]
 * @param {string} [props.tooltip]
 */
export function FilterMultiSelect({ label, options, selected, onToggle, searchable, tooltip }) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query, searchable]);

  return (
    <div className={styles.control}>
      <div className={styles.label}>
        <span>{label}</span>
        {selected.length > 0 && <span className={styles.count}>{selected.length}</span>}
        {tooltip && (
          <span className={styles.info} title={tooltip} aria-label={tooltip}>
            i
          </span>
        )}
      </div>

      {searchable && (
        <input
          className={styles.search}
          type="search"
          placeholder={`Search ${label.toLowerCase()}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={`Search ${label}`}
        />
      )}

      <div className={styles.options} role="group" aria-label={label}>
        {visible.length === 0 ? (
          <div className={styles.empty}>No options</div>
        ) : (
          visible.map((option) => (
            <label key={option} className={styles.option}>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => onToggle(option)}
              />
              <span>{option}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export default FilterMultiSelect;
