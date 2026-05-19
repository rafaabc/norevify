import { useEffect } from 'react';

export function useAutoClear(value, setter, delay = 3000) {
  useEffect(() => {
    if (!value) return;
    const id = setTimeout(() => setter(typeof value === 'boolean' ? false : ''), delay);
    return () => clearTimeout(id);
  }, [value, setter, delay]);
}
