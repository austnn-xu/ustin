import { startTransition, useEffect, useState, type ReactNode } from 'react';

/**
 * Renders `fallback` straight away, then `children` as a React transition. A transition renders in small slices and
 * yields to the browser between them, so a heavy screen fills in without freezing taps, scrolling or animations — the
 * difference between a tab that appears in a beat and one that locks the phone for half a second.
 */
export function Deferred({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    startTransition(() => setReady(true));
  }, []);
  return <>{ready ? children : fallback}</>;
}
