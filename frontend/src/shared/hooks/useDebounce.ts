import { useEffect, useState } from 'react';

/**
 * Delays updating the returned value until `delay` ms have passed
 * since the last change to `value`. Useful for search inputs to
 * avoid firing API requests on every keystroke.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 */
function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
