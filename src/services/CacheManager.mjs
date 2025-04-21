import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

class CacheManager {
  constructor(maxItems = 1000, maxAge = 1000 * 60 * 60) {
    this.cache = new LRUCache({
      max: maxItems,
      maxAge: maxAge
    });
  }

  generateKey(agent, prompt, context) {
    const data = JSON.stringify({ agent, prompt, context });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  set(agent, prompt, context, result) {
    const key = this.generateKey(agent, prompt, context);
    this.cache.set(key, result);
  }

  get(agent, prompt, context) {
    const key = this.generateKey(agent, prompt, context);
    return this.cache.get(key);
  }

  getStats() {
    return {
      itemCount: this.cache.size,
      maxAge: this.cache.maxAge
    };
  }

  clear() {
    this.cache.clear();
  }
}

export default CacheManager; 