import { useCallback, useMemo, useState } from 'react';

export function useAvailabilitySelection(initialKeys = []) {
  const [selected, setSelected] = useState(() => new Set(initialKeys));

  const paint = useCallback((key, shouldSelect) => {
    setSelected((previous) => {
      const isSelected = previous.has(key);
      if (shouldSelect === isSelected) return previous;
      const next = new Set(previous);
      if (shouldSelect) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const toggle = useCallback((key) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const replace = useCallback((keys) => {
    setSelected(new Set(keys || []));
  }, []);

  const selectedArray = useMemo(() => [...selected], [selected]);

  return {
    selected,
    selectedArray,
    count: selected.size,
    paint,
    toggle,
    clear,
    replace,
  };
}
