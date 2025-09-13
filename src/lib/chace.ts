// import Redis from "ioredis";

// // Redis client
// let redis: Redis | null = null;
// try {
//   redis = new Redis(process.env.REDIS_URL || ""); // kosong = disable redis
// } catch (err) {
//   console.warn("⚠️ Redis tidak tersedia, fallback ke in-memory Map");
//   redis = null;
// }

// // In-memory Map fallback
// const localCache = new Map<string, { value: any; expiresAt: number }>();
// const LOCAL_TTL = 5 * 60 * 1000; // 5 menit

// export async function getCache<T = any>(key: string): Promise<T | null> {
//   // 🔹 cek Redis lebih dulu
//   if (redis) {
//     try {
//       const data = await redis.get(key);
//       if (data) return JSON.parse(data) as T;
//     } catch (err) {
//       console.error("Redis error:", err);
//     }
//   }

//   // 🔹 fallback ke Map
//   const cached = localCache.get(key);
//   if (cached && cached.expiresAt > Date.now()) {
//     return cached.value as T;
//   }
//   return null;
// }

// export async function setCache(key: string, value: any, ttlSeconds = 300) {
//   // 🔹 simpan ke Redis
//   if (redis) {
//     try {
//       await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
//       return;
//     } catch (err) {
//       console.error("Redis error saat set:", err);
//     }
//   }

//   // 🔹 fallback ke Map
//   localCache.set(key, {
//     value,
//     expiresAt: Date.now() + ttlSeconds * 1000,
//   });
// }
