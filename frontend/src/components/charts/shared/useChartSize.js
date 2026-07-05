import { useEffect, useRef, useState } from 'react';

/**
 * Measure a container's width so charts can render responsively. Returns a ref to attach
 * to the container and its current width (0 until first measured).
 *
 * @returns {[React.RefObject<HTMLDivElement>, number]}
 */
export function useChartSize() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return undefined;
    const el = ref.current;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      setWidth(Math.floor(w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

export default useChartSize;
