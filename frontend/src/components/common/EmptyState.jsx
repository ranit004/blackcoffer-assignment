import styles from './EmptyState.module.css';

/**
 * Shown when a filter combination returns zero rows. Offers a shortcut to clear filters.
 * @param {object} props
 * @param {() => void} [props.onClear]
 * @param {string} [props.message]
 */
export function EmptyState({ onClear, message = 'No results match these filters.' }) {
  return (
    <div className={styles.empty} role="status">
      <div className={styles.icon} aria-hidden="true">
        ⌀
      </div>
      <p className={styles.message}>{message}</p>
      {onClear && (
        <button type="button" className={styles.button} onClick={onClear}>
          Clear all filters
        </button>
      )}
    </div>
  );
}

export default EmptyState;
