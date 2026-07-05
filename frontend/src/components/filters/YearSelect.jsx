import styles from './filters.module.css';

/**
 * Single-select dropdown for the End Year filter, populated from the API.
 *
 * @param {object} props
 * @param {number[]} props.years
 * @param {string} props.value - selected year (string) or ''.
 * @param {(year: string) => void} props.onChange
 */
export function YearSelect({ years, value, onChange }) {
  return (
    <div className={styles.control}>
      <div className={styles.label}>
        <span>End Year</span>
      </div>
      <select
        className={styles.select}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label="End Year"
      >
        <option value="">All years</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

export default YearSelect;
