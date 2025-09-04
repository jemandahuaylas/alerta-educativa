// Timeout handler utility for Vercel optimization

export class TimeoutError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Create a promise that rejects after a timeout
export function createTimeoutPromise(ms: number, operation: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation '${operation}' timed out after ${ms}ms`, operation));
    }, ms);
  });
}

// Wrap any promise with a timeout
export async function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  operation: string
): Promise<T> {
  const timeoutPromise = createTimeoutPromise(timeoutMs, operation);
  
  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if (error instanceof TimeoutError) {
      console.error(`⏰ ${error.message}`);
      throw error;
    }
    throw error;
  }
}

// Retry mechanism with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operation: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting ${operation} (${attempt}/${maxRetries})`);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        console.error(`❌ ${operation} failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`⚠️ ${operation} attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Batch operations to avoid overwhelming the database
export async function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 10,
  operation: string = 'batch operation'
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`🔄 Processing ${operation} batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (${batch.length} items)`);
    
    try {
      const batchResults = await withTimeout(
        processor(batch),
        8000, // 8 second timeout per batch
        `${operation} batch ${Math.floor(i / batchSize) + 1}`
      );
      results.push(...batchResults);
    } catch (error) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      throw error;
    }
  }
  
  return results;
}

// Simple in-memory cache for frequently accessed data
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

export const appCache = new SimpleCache();

// Cache wrapper for database operations
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  // Try to get from cache first
  const cached = appCache.get(key);
  if (cached !== null) {
    console.log(`📦 Cache hit for key: ${key}`);
    return cached;
  }
  
  // Fetch fresh data
  console.log(`🔄 Cache miss for key: ${key}, fetching fresh data`);
  const data = await fetcher();
  
  // Store in cache
  appCache.set(key, data, ttlMs);
  
  return data;
}