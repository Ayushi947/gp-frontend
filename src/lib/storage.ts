/**
 * Safe storage utilities for localStorage and sessionStorage
 * Handles SSR, hydration, and storage errors gracefully
 */

import { isClient } from './utils';

type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Get a storage instance (localStorage or sessionStorage)
 */
function getStorage(type: StorageType): Storage | null {
  if (!isClient()) return null;

  try {
    const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
    // Test if storage is available
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

/**
 * Create a type-safe storage wrapper
 */
function createStorage(type: StorageType) {
  return {
    /**
     * Get an item from storage
     * Returns the parsed value or the default value if not found/error
     */
    get: <T>(key: string, defaultValue: T): T => {
      const storage = getStorage(type);
      if (!storage) return defaultValue;

      try {
        const item = storage.getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
      } catch {
        return defaultValue;
      }
    },

    /**
     * Get a raw string from storage
     */
    getString: (key: string, defaultValue: string = ''): string => {
      const storage = getStorage(type);
      if (!storage) return defaultValue;

      try {
        return storage.getItem(key) ?? defaultValue;
      } catch {
        return defaultValue;
      }
    },

    /**
     * Set an item in storage
     * Returns true if successful, false otherwise
     */
    set: <T>(key: string, value: T): boolean => {
      const storage = getStorage(type);
      if (!storage) return false;

      try {
        storage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        // Handle quota exceeded error
        if (
          error instanceof DOMException &&
          (error.code === 22 ||
            error.code === 1014 ||
            error.name === 'QuotaExceededError' ||
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
        ) {
          console.warn(`Storage quota exceeded for key: ${key}`);
        }
        return false;
      }
    },

    /**
     * Set a raw string in storage
     */
    setString: (key: string, value: string): boolean => {
      const storage = getStorage(type);
      if (!storage) return false;

      try {
        storage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },

    /**
     * Remove an item from storage
     */
    remove: (key: string): boolean => {
      const storage = getStorage(type);
      if (!storage) return false;

      try {
        storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },

    /**
     * Check if a key exists in storage
     */
    has: (key: string): boolean => {
      const storage = getStorage(type);
      if (!storage) return false;

      try {
        return storage.getItem(key) !== null;
      } catch {
        return false;
      }
    },

    /**
     * Clear all items from storage
     */
    clear: (): boolean => {
      const storage = getStorage(type);
      if (!storage) return false;

      try {
        storage.clear();
        return true;
      } catch {
        return false;
      }
    },

    /**
     * Get all keys in storage
     */
    keys: (): string[] => {
      const storage = getStorage(type);
      if (!storage) return [];

      try {
        return Object.keys(storage);
      } catch {
        return [];
      }
    },

    /**
     * Get the number of items in storage
     */
    length: (): number => {
      const storage = getStorage(type);
      if (!storage) return 0;

      try {
        return storage.length;
      } catch {
        return 0;
      }
    },
  };
}

/**
 * localStorage wrapper with type safety and error handling
 */
export const storage = createStorage('localStorage');

/**
 * sessionStorage wrapper with type safety and error handling
 */
export const sessionStore = createStorage('sessionStorage');

/**
 * Storage keys used in the application
 * Centralized to prevent key conflicts and typos
 */
export const STORAGE_KEYS = {
  // User preferences
  THEME: 'gp_theme',
  SIDEBAR_COLLAPSED: 'gp_sidebar_collapsed',
  TABLE_PAGE_SIZE: 'gp_table_page_size',

  // Onboarding state
  ONBOARDING_DATA: 'gp_onboarding_data',
  ONBOARDING_STEP: 'gp_onboarding_step',

  // Session data (use sessionStorage via sessionStore)
  REGISTRATION_DATA: 'gp_registration_data',

  // Feature flags
  FEATURE_FLAGS: 'gp_feature_flags',

  // User display data (NOT tokens - those are in httpOnly cookies)
  USER_DISPLAY: 'gp_user_display',

  // Recent searches
  RECENT_SEARCHES: 'gp_recent_searches',

  // Table filters
  PARTICIPANT_FILTERS: 'gp_participant_filters',
  CONTRIBUTION_FILTERS: 'gp_contribution_filters',

  // UI state
  DISMISSED_BANNERS: 'gp_dismissed_banners',
  VIEWED_ANNOUNCEMENTS: 'gp_viewed_announcements',
} as const;

/**
 * Type for storage keys
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
