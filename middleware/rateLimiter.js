// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import { TooManyRequestsError } from '../errors/errors.js'; 

/**
 * Custom rate limiter middleware with Redis store (optional)
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per windowMs
 * @param {string} options.message - Error message when limit is exceeded
 * @param {boolean} options.standardHeaders - Return rate limit info in headers
 * @param {boolean} options.legacyHeaders - Disable the legacy headers
 * @returns {Function} Express rate limiter middleware
 */
const rateLimiter = (options = {}) => {
  // Default configuration
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
      // Custom handler when limit is exceeded
      if (options.store instanceof MemoryStore) {
        options.store.resetAll(); // Reset the store (for development)
      }
      throw new TooManyRequestsError(options.message);
    }
  };

  // Merge with provided options
  const finalOptions = { ...defaultOptions, ...options };

  // Create the rate limiter
  return rateLimit(finalOptions);
};

// In-memory store (for development)
class MemoryStore {
  constructor() {
    this.hits = {};
    this.resetTime = Date.now() + (15 * 60 * 1000); // Default 15 minutes
  }

  increment(key) {
    if (!this.hits[key]) {
      this.hits[key] = 0;
    }
    this.hits[key]++;
    return this.hits[key];
  }

  resetKey(key) {
    delete this.hits[key];
  }

  resetAll() {
    this.hits = {};
    this.resetTime = Date.now() + (15 * 60 * 1000);
  }
}

// Redis store (for production - uncomment if you have Redis)
/*
import Redis from 'ioredis';
const redisClient = new Redis(process.env.REDIS_URL);

class RedisStore {
  constructor() {
    this.client = redisClient;
    this.windowMs = 15 * 60 * 1000; // Default 15 minutes
  }

  async increment(key) {
    const now = Date.now();
    const resetTime = now + this.windowMs;
    
    const result = await this.client.multi()
      .incr(key)
      .pexpire(key, this.windowMs)
      .exec();
    
    return {
      totalHits: result[0][1],
      resetTime: new Date(resetTime)
    };
  }
}
*/

export { rateLimiter }; // named export
export default rateLimiter; // default export
