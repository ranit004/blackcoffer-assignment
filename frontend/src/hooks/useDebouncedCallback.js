import { useEffect, useMemo, useRef } from 'react';

/**
 * Returns a debounced version of `callback` that only fires after `delay` ms have
 * elapsed since the last call. Used so dragging a range slider doesn't spam the API.
 *
 * @param {Function} callback
 * @param {number} delay - milliseconds.
 * @returns {Function}
 */
export function useDebouncedCallback(callback, delay = 300) {
  const cbRef = useRef(callback);
  const timerRef = useRef(null);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useMemo(() => {
    return (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => cbRef.current(...args), delay);
    };
  }, [delay]);
}

export default useDebouncedCallback;
