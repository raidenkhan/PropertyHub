// // src/manager/redis-cache.service.ts
// import { Injectable } from '@nestjs/common';
// import Redis from 'ioredis';

// @Injectable()
// export class RedisCacheService {
//   private client: Redis;

//   constructor() {
//     this.client = new Redis({
//       host: process.env.REDIS_HOST || 'localhost',
//       port: parseInt(process.env.REDIS_PORT) || 6379,
//     });
//   }

//   async get<T>(key: string): Promise<T | null> {
//     const data = await this.client.get(key);
//     return data ? JSON.parse(data) : null;
//   }

//   async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
//     await this.client.setex(key, ttlSeconds, JSON.stringify(value));
//   }

//   async del(key: string): Promise<void> {
//     await this.client.del(key);
//   }
// }