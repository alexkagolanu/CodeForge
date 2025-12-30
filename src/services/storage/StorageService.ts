/**
 * Storage Service - Manages storage drivers and caching
 */

import type { IStorageDriver } from './StorageInterface';
import { LocalStorageDriver } from './LocalStorageDriver';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

class StorageService {
  private driver: IStorageDriver;
  private initialized = false;

  constructor() {
    // Prefer Supabase when environment variables are present; fallback to LocalStorage
    const hasSupabase = typeof import.meta !== 'undefined' && !!(import.meta as any).env?.VITE_SUPABASE_URL && !!(import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (hasSupabase) {
      try {
        // Lazy import to avoid circulars at build time
        const { SupabaseDriver } = require('./SupabaseDriver');
        this.driver = new SupabaseDriver();
      } catch {
        this.driver = new LocalStorageDriver();
      }
    } else {
      this.driver = new LocalStorageDriver();
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Decide driver at initialization time using dynamic import for Supabase
    const hasSupabase = typeof import.meta !== 'undefined' && !!(import.meta as any).env?.VITE_SUPABASE_URL && !!(import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (hasSupabase) {
      try {
        const mod = await import('./SupabaseDriver');
        const Driver = (mod as any).SupabaseDriver;
        if (Driver) this.driver = new Driver();
      } catch (e) {
        console.warn('Falling back to LocalStorageDriver due to SupabaseDriver load error:', e);
        this.driver = new LocalStorageDriver();
      }
    } else {
      this.driver = new LocalStorageDriver();
    }

    await this.driver.initialize();
    this.initialized = true;
  }

  setDriver(driver: IStorageDriver): void {
    this.driver = driver;
    this.initialized = false;
    cache.clear();
  }

  getDriver(): IStorageDriver {
    return this.driver;
  }

  // Cache helpers
  getCached<T>(key: string): T | null {
    const cached = cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      cache.clear();
      return;
    }
    
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const storageService = new StorageService();
