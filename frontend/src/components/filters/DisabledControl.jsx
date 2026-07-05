import styles from './filters.module.css';

/**
 * A visibly-present but disabled filter control, with an explanatory tooltip. Used for
 * City and SWOT — dimensions the assignment lists but which the source dataset does not
 * contain. Rendering them (disabled + explained) documents that they were considered,
 * rather than silently omitting them.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.tooltip
 */
export function DisabledControl({ label, tooltip }) {
  return (
    <div className={`${styles.control} ${styles.disabled}`}>
      <div className={styles.label}>
        <span>{label}</span>
        <span className={styles.info} title={tooltip} aria-label={tooltip}>
          i
        </span>
      </div>
      <div className={styles.disabledBox} title={tooltip}>
        {tooltip}
      </div>
    </div>
  );
}

export default DisabledControl;
