import styles from './Skeleton.module.css';

/**
 * A shimmering placeholder box used as a loading state (e.g. chart areas).
 * @param {object} props
 * @param {number|string} [props.height]
 */
export function Skeleton({ height = 240 }) {
  return <div className={styles.skeleton} style={{ height }} aria-hidden="true" />;
}

export default Skeleton;
