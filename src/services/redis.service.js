// Purely in-memory cache for now (Redis removed as per request)
const memoryCache = new Map();

export const getCachedData = async (key) => {
  const item = memoryCache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.data;
  } else if (item) {
    memoryCache.delete(key);
  }
  return null;
};

export const setCachedData = async (key, data, expirationInSeconds = 3600) => {
  memoryCache.set(key, {
    data,
    expiry: Date.now() + expirationInSeconds * 1000
  });
};

export const clearCache = async (keyPattern) => {
  const regex = new RegExp('^' + keyPattern.replace(/\*/g, '.*') + '$');
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
};
