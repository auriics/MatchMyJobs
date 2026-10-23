import Redis from 'ioredis';
import { config } from './env.js';

class InMemoryCache {
  private store = new Map<string, { value: string; expiry: number | null }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiry: number | null = null;
    if (mode === 'EX' && duration) {
      expiry = Date.now() + duration * 1000;
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async exists(key: string): Promise<number> {
    const val = await this.get(key);
    return val !== null ? 1 : 0;
  }
}

export type CacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
};

let redisClient: CacheClient;
const inMemoryFallback = new InMemoryCache();

try {
  const realRedis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 2) {
        return null; // Stop reconnecting to prevent log spam in dev if Redis is off
      }
      return 1000;
    },
    lazyConnect: true,
  });

  let isConnected = false;

  realRedis.connect().then(() => {
    isConnected = true;
    console.log('[Redis] Connected successfully to', config.redisUrl);
  }).catch((err) => {
    console.warn('[Redis] Connection failed, using in-memory cache fallback:', err.message);
  });

  realRedis.on('error', (err) => {
    if (isConnected) {
      console.warn('[Redis] Connection error:', err.message);
    }
  });

  redisClient = {
    async get(key: string) {
      if (isConnected) {
        try {
          return await realRedis.get(key);
        } catch {
          return inMemoryFallback.get(key);
        }
      }
      return inMemoryFallback.get(key);
    },
    async set(key: string, value: string, mode?: string, duration?: number) {
      if (isConnected) {
        try {
          if (mode === 'EX' && duration) {
            return await realRedis.set(key, value, 'EX', duration);
          }
          return await realRedis.set(key, value);
        } catch {
          return inMemoryFallback.set(key, value, mode, duration);
        }
      }
      return inMemoryFallback.set(key, value, mode, duration);
    },
    async del(...keys: string[]) {
      if (isConnected) {
        try {
          return await realRedis.del(...keys);
        } catch {
          return inMemoryFallback.del(...keys);
        }
      }
      return inMemoryFallback.del(...keys);
    },
    async exists(key: string) {
      if (isConnected) {
        try {
          return await realRedis.exists(key);
        } catch {
          return inMemoryFallback.exists(key);
        }
      }
      return inMemoryFallback.exists(key);
    },
  };
} catch {
  console.warn('[Redis] Initializing in-memory cache directly');
  redisClient = inMemoryFallback;
}

export { redisClient };
