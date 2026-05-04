'use client';

import { useState, useEffect, useCallback } from 'react';
import { storage, sessionStore } from '@/lib/storage';
import { useHydrated } from './useHydrated';

type StorageType = 'localStorage' | 'sessionStorage';

interface UsePersistedStateOptions<T> {
  /**
   * Storage key
   */
  key: string;

  /**
   * Initial value (used when no stored value exists)
   */
  initialValue: T;

  /**
   * Storage type (default: localStorage)
   */
  storageType?: StorageType;
}

/**
 * Hook that persists state to localStorage or sessionStorage
 * Handles hydration and storage errors gracefully
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = usePersistedState({
 *   key: 'app_theme',
 *   initialValue: 'light',
 * });
 * ```
 */
export function usePersistedState<T>({
  key,
  initialValue,
  storageType = 'localStorage',
}: UsePersistedStateOptions<T>): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const isHydrated = useHydrated();
  const storageInstance = storageType === 'localStorage' ? storage : sessionStore;

  // Initialize with initial value (will be updated after hydration)
  const [state, setState] = useState<T>(initialValue);

  // Hydrate from storage after mount
  useEffect(() => {
    if (!isHydrated) return;

    const storedValue = storageInstance.get<T>(key, initialValue);
    setState(storedValue);
  }, [isHydrated, key, initialValue, storageInstance]);

  // Update storage when state changes (after hydration)
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;

        // Persist to storage
        if (isHydrated) {
          storageInstance.set(key, newValue);
        }

        return newValue;
      });
    },
    [key, isHydrated, storageInstance]
  );

  return [state, setValue, isHydrated];
}

/**
 * Hook for persisting form data during multi-step flows
 * Automatically clears data on success
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   updateData,
 *   clearData,
 *   isHydrated,
 * } = useFormPersistence<OnboardingData>({
 *   key: 'onboarding_data',
 *   initialValue: defaultOnboardingData,
 * });
 * ```
 */
export function useFormPersistence<T extends Record<string, unknown>>({
  key,
  initialValue,
  storageType = 'sessionStorage',
}: UsePersistedStateOptions<T>) {
  const [data, setData, isHydrated] = usePersistedState({
    key,
    initialValue,
    storageType,
  });

  const updateData = useCallback(
    (updates: Partial<T>) => {
      setData((prev) => ({ ...prev, ...updates }));
    },
    [setData]
  );

  const clearData = useCallback(() => {
    setData(initialValue);
    const storageInstance = storageType === 'localStorage' ? storage : sessionStore;
    storageInstance.remove(key);
  }, [setData, initialValue, key, storageType]);

  return {
    data,
    setData,
    updateData,
    clearData,
    isHydrated,
  };
}
