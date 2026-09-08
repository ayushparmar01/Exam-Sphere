/**
 * Redis Configuration & Fallback Cache
 * ExamSphere Scalability Layer
 */
const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;

// Local in-memory fallback cache for development or when Redis is unavailable
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

const initRedis = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log('[Redis] REDIS_URL not configured. Operating with resilient in-memory fallback cache.');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[Redis] Max reconnect retries reached. Falling back to in-memory mode.');
          return null; // Stop retrying, use fallback
        }
        return Math.min(times * 1000, 3000);
      },
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('[Redis] Connected successfully to Redis server');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      // Non-fatal error notice; graceful fallback is maintained
      console.warn(`[Redis] Connection warning: ${err.message}. Using fallback.`);
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    return redisClient;
  } catch (err) {
    console.warn(`[Redis] Initialization skipped: ${err.message}. Operating with in-memory fallback.`);
    return null;
  }
};

// Initialize on module load
initRedis();

const cacheService = {
  async get(key) {
    if (isConnected && redisClient) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (e) {
        // Fall back to memory
      }
    }

    // In-memory fallback
    const expiry = memoryCacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
      return null;
    }
    return memoryCache.get(key) || null;
  },

  async set(key, value, ttlSeconds = 60) {
    if (isConnected && redisClient) {
      try {
        await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return true;
      } catch (e) {
        // Fall back to memory
      }
    }

    // In-memory fallback
    memoryCache.set(key, value);
    if (ttlSeconds) {
      memoryCacheExpiry.set(key, Date.now() + ttlSeconds * 1000);
    }
    return true;
  },

  async del(key) {
    if (isConnected && redisClient) {
      try {
        await redisClient.del(key);
      } catch (e) {
        // Fall back to memory
      }
    }
    memoryCache.delete(key);
    memoryCacheExpiry.delete(key);
    return true;
  },

  isRedisConnected() {
    return isConnected;
  },

  getClient() {
    return redisClient;
  },
};

module.exports = cacheService;
