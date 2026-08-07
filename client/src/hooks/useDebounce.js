import { useState, useEffect } from 'react';

/**
 * Delays updating `value` by `delay` ms.
 * Use to debounce search inputs so you don't fire an API call on every keystroke.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(search, 400);
 *   useEffect(() => { fetchData(debouncedSearch); }, [debouncedSearch]);
 */
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export default useDebounce;
