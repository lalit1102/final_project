import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { logger } from './logger';

let rateLimiter: RateLimiterRedis | RateLimiterMemory;

if (process.env.NODE_ENV === 'production') {
  // Use Redis in production
  const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  
  redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });

  rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 100, // Number of points
    duration: 60, // Per 60 seconds
  });
} else {
  // Fallback to memory for development
  rateLimiter = new RateLimiterMemory({
    points: 100,
    duration: 60,
  });
}

export { rateLimiter };
