/**
 * Caché en memoria con TTL.
 *
 * En Vercel cada instancia de la función conserva su memoria entre
 * invocaciones tibias, lo que reduce drásticamente las lecturas a Sheets.
 */
function createTtlCache(defaultTtlMs = 30000) {
  let value = null;
  let expiresAt = 0;
  let ttlMs = defaultTtlMs;

  return {
    get() {
      if (value === null || Date.now() >= expiresAt) return null;
      return value;
    },
    set(nextValue, customTtlMs) {
      value = nextValue;
      ttlMs = Number(customTtlMs || defaultTtlMs);
      expiresAt = Date.now() + ttlMs;
    },
    clear() {
      value = null;
      expiresAt = 0;
    },
    status() {
      return {
        hasValue: value !== null,
        fresh: value !== null && Date.now() < expiresAt,
        expiresAt,
        ttlMs,
      };
    },
  };
}

module.exports = { createTtlCache };
