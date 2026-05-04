'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to check if the component has been hydrated on the client
 * Use this to prevent hydration mismatches when accessing browser APIs
 *
 * @returns boolean indicating if hydration is complete
 *
 * @example
 * ```tsx
 * const isHydrated = useHydrated();
 *
 * if (!isHydrated) {
 *   return <Skeleton />;
 * }
 *
 * return <ComponentThatUsesLocalStorage />;
 * ```
 */
export function useHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
