import { STORAGE_KEYS } from '@/constants';
import { storage } from '@/services/storage/persistence';
import { createSeedData, type Database } from '../data/seed';

/**
 * In-memory database backed by localStorage. The MSW handlers read and write
 * through this module so that all mock data persists across browser refreshes.
 */
let db: Database = load();

function load(): Database {
  const persisted = storage.get<Database>(STORAGE_KEYS.db);
  if (persisted && persisted.users?.length) {
    return persisted;
  }
  const seeded = createSeedData();
  storage.set(STORAGE_KEYS.db, seeded);
  return seeded;
}

function persist(): void {
  storage.set(STORAGE_KEYS.db, db);
}

export const database = {
  /** Direct read access to the current database snapshot. */
  get data(): Database {
    return db;
  },

  /**
   * Mutate the database via a callback, then persist. Returns the callback's
   * result so handlers can return created/updated entities.
   */
  update<T>(mutator: (data: Database) => T): T {
    const result = mutator(db);
    persist();
    return result;
  },

  /** Reset all data back to the seeded demo state. */
  reset(): void {
    db = createSeedData();
    persist();
  },
};
