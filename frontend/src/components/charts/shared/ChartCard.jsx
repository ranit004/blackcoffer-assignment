import { Skeleton } from '../../common/Skeleton.jsx';
import styles from './ChartCard.module.css';

/**
 * Shared card frame for every chart: title, loading skeleton, empty-data placeholder,
 * the chart body, and a one-line plain-English insight caption underneath.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {boolean} [props.isLoading]
 * @param {boolean} [props.isEmpty]
 * @param {string} [props.caption] - computed insight sentence.
 * @param {React.ReactNode} props.children
 */
export function ChartCard({ title, isLoading, isEmpty, caption, children }) {
  return (
    <section className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.body}>
        {isLoading ? (
          <Skeleton height={240} />
        ) : isEmpty ? (
          <div className={styles.empty}>No data for the current filters.</div>
        ) : (
          children
        )}
      </div>
      {caption && !isLoading && !isEmpty && <p className={styles.caption}>{caption}</p>}
    </section>
  );
}

export default ChartCard;
