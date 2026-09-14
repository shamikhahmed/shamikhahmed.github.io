const LEGACY_KEYS = ['po5', 'po5_backup'];
const META_KEY = 'prismos_meta_v1';

export const SaveManager = {
  migrateLegacy(): void {
    try {
      const existing = localStorage.getItem(META_KEY);
      if (existing) return;
      const hasLegacy = LEGACY_KEYS.some((k) => !!localStorage.getItem(k));
      localStorage.setItem(META_KEY, JSON.stringify({ migratedAt: Date.now(), hasLegacy }));
    } catch {
      // no-op
    }
  },
};

