import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Initialize the raw Redis client
const actualRedisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

let useMemoryFallback = false;
let loggedOfflineWarning = false;
const fallbackStore = new Map<string, string>();

actualRedisClient.on("error", (err) => {
  // Gracefully report error only once to prevent console spamming
  if (!loggedOfflineWarning) {
    console.warn(`[Redis Client] Offline: ${err.message}. Using in-memory fallback cache.`);
    loggedOfflineWarning = true;
  }
  useMemoryFallback = true;
});

actualRedisClient.on("connect", () => {
  console.log("[Redis Client] Connection handshake initiated...");
});

actualRedisClient.on("ready", () => {
  console.log("[Redis Client] Ready and connected. Disabling in-memory fallback.");
  useMemoryFallback = false;
  loggedOfflineWarning = false; // Reset log flag if it re-establishes connection
});

actualRedisClient.on("end", () => {
  console.log("[Redis Client] Connection closed.");
  useMemoryFallback = true;
});

// Wrapped Redis interface executing transparent fallbacks
export const redisClient = {
  isOpen: false,

  get: async (key: string): Promise<string | null> => {
    if (useMemoryFallback || !actualRedisClient.isOpen) {
      return fallbackStore.get(key) || null;
    }
    try {
      return await actualRedisClient.get(key);
    } catch (err) {
      console.warn("[Redis Fallback] GET error, using memory:", err);
      return fallbackStore.get(key) || null;
    }
  },

  set: async (key: string, value: string): Promise<string | null> => {
    fallbackStore.set(key, value);
    if (useMemoryFallback || !actualRedisClient.isOpen) {
      return "OK";
    }
    try {
      return await actualRedisClient.set(key, value);
    } catch (err) {
      console.warn("[Redis Fallback] SET error, using memory:", err);
      return "OK";
    }
  },

  decrBy: async (key: string, value: number): Promise<number> => {
    const currentVal = fallbackStore.get(key);
    const numVal = currentVal ? Number(currentVal) : 0;
    const newVal = numVal - value;
    fallbackStore.set(key, String(newVal));

    if (useMemoryFallback || !actualRedisClient.isOpen) {
      return newVal;
    }
    try {
      return await actualRedisClient.decrBy(key, value);
    } catch (err) {
      console.warn("[Redis Fallback] DECRBY error, using memory:", err);
      return newVal;
    }
  },

  rPush: async (key: string, value: string): Promise<number> => {
    const currentQueue = fallbackStore.get(key);
    const queue = currentQueue ? JSON.parse(currentQueue) : [];
    queue.push(value);
    fallbackStore.set(key, JSON.stringify(queue));

    if (useMemoryFallback || !actualRedisClient.isOpen) {
      return queue.length;
    }
    try {
      return await actualRedisClient.rPush(key, value);
    } catch (err) {
      console.warn("[Redis Fallback] RPUSH error, using memory:", err);
      return queue.length;
    }
  },

  lPush: async (key: string, value: string): Promise<number> => {
    const currentQueue = fallbackStore.get(key);
    const queue = currentQueue ? JSON.parse(currentQueue) : [];
    queue.unshift(value); // push to head
    fallbackStore.set(key, JSON.stringify(queue));

    if (useMemoryFallback || !actualRedisClient.isOpen) {
      return queue.length;
    }
    try {
      return await actualRedisClient.lPush(key, value);
    } catch (err) {
      console.warn("[Redis Fallback] LPUSH error, using memory:", err);
      return queue.length;
    }
  },

  blPop: async (key: string, timeout: number): Promise<{ key: string; element: string } | null> => {
    if (useMemoryFallback || !actualRedisClient.isOpen) {
      // Emulate blocking POP in local memory
      while (true) {
        const currentQueue = fallbackStore.get(key);
        const queue = currentQueue ? JSON.parse(currentQueue) : [];
        if (queue.length > 0) {
          const element = queue.shift();
          fallbackStore.set(key, JSON.stringify(queue));
          return { key, element };
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    try {
      return await actualRedisClient.blPop(key, timeout);
    } catch (err) {
      console.warn("[Redis Fallback] BLPOP error, using memory:", err);
      while (true) {
        const currentQueue = fallbackStore.get(key);
        const queue = currentQueue ? JSON.parse(currentQueue) : [];
        if (queue.length > 0) {
          const element = queue.shift();
          fallbackStore.set(key, JSON.stringify(queue));
          return { key, element };
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  },

  ping: async (): Promise<string> => {
    if (useMemoryFallback || !actualRedisClient.isOpen) {
      return "PONG";
    }
    try {
      const res = await actualRedisClient.ping();
      return res;
    } catch (err) {
      return "PONG";
    }
  },
};

// Bind isOpen property dynamically
Object.defineProperty(redisClient, "isOpen", {
  get: () => actualRedisClient.isOpen || useMemoryFallback,
  configurable: true,
  enumerable: true,
});

// Establish client connection on server boot
export const connectRedis = async (): Promise<void> => {
  // Connect asynchronously to prevent hanging the server startup if Redis is offline
  actualRedisClient.connect().catch((error: any) => {
    console.warn("[Redis Client] Connection failed asynchronously:", error.message);
    useMemoryFallback = true;
  });
};

export default redisClient;
