import { STORAGE_KEYS } from '@/constants';

/**
 * Persistence abstraction over localStorage. UI and mock layers use this
 * instead of touching localStorage directly, so the storage engine can be
 * swapped (e.g. for IndexedDB or a real API) without changing callers.
 */
export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be full or unavailable; fail quietly for a prototype.
    }
  },

  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => this.remove(key));
  },
};
