import { Injectable } from '@nestjs/common';

interface CacheItem {
  data: any;
  expiry: number;
}

/**
 * Simple in-memory cache service for job search performance optimization
 * In production, this would be replaced with Redis
 */
@Injectable()
export class JobSearchCacheService {
  private readonly cache = new Map<string, CacheItem>();

  private readonly CACHE_TTL = {
    SEARCH_RESULTS: 3000, // 5 minutes in milliseconds
    SUGGESTIONS: 3600000, // 1 hour in milliseconds
    HOT_QUERIES: 1800000, // 30 minutes in milliseconds
    FILTERS: 7200000, // 2 hours in milliseconds
  };

  private readonly CACHE_KEYS = {
    SEARCH: 'job-search',
    SUGGESTIONS: 'job-suggestions',
    HOT_QUERIES: 'hot-queries',
    FILTER_CATEGORIES: 'filter-categories',
    FILTER_COMPANIES: 'filter-companies',
  };

  constructor() {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 300000);
  }

  /**
   * Generate cache key for search results
   */
  generateSearchKey(params: any): string {
    const normalizedParams = {
      q: params.query || '',
      location: params.location || '',
      categoryIds: (params.categoryIds || []).sort().join(','),
      companyIds: (params.companyIds || []).sort().join(','),
      employmentTypes: (params.employmentTypes || []).sort().join(','),
      salaryMin: params.salaryMin || 0,
      salaryMax: params.salaryMax || 0,
      minExp: params.minExperienceYears || 0,
      activeOnly: params.activeOnly || true,
      sortBy: params.sortBy || 'relevance',
      page: params.page || 1,
      limit: params.limit || 10,
    };

    const keyString = Object.entries(normalizedParams)
      .filter(([, value]) => value !== '' && value !== 0 && value !== false)
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    return `${this.CACHE_KEYS.SEARCH}:${this.hashString(keyString)}`;
  }

  /**
   * Generate cache key for suggestions
   */
  generateSuggestionsKey(query: string, limit: number = 5): string {
    return `${this.CACHE_KEYS.SUGGESTIONS}:${this.hashString(query)}:${limit}`;
  }

  /**
   * Get cached search results
   */
  async getSearchResults(cacheKey: string): Promise<any | null> {
    return this.get(cacheKey);
  }

  /**
   * Cache search results
   */
  async setSearchResults(cacheKey: string, data: any): Promise<void> {
    this.set(cacheKey, data, this.CACHE_TTL.SEARCH_RESULTS);
  }

  /**
   * Get cached suggestions
   */
  async getSuggestions(cacheKey: string): Promise<string[] | null> {
    return this.get(cacheKey);
  }

  /**
   * Cache suggestions
   */
  async setSuggestions(cacheKey: string, suggestions: string[]): Promise<void> {
    this.set(cacheKey, suggestions, this.CACHE_TTL.SUGGESTIONS);
  }

  /**
   * Track hot queries for analytics and optimization
   */
  async trackHotQuery(query: string): Promise<void> {
    if (!query || query.length < 2) return;

    const key = `${this.CACHE_KEYS.HOT_QUERIES}:${this.hashString(query)}`;
    const currentCount = this.get<number>(key) || 0;
    this.set(key, currentCount + 1, this.CACHE_TTL.HOT_QUERIES);
  }

  /**
   * Get popular search terms for optimization
   */
  async getHotQueries(
    limit: number = 10,
  ): Promise<Array<{ query: string; count: number }>> {
    const hotQueries: Array<{ query: string; count: number }> = [];
    for (const [key, item] of this.cache.entries()) {
      if (
        key.startsWith(this.CACHE_KEYS.HOT_QUERIES) &&
        !this.isExpired(item)
      ) {
        const query = key.replace(`${this.CACHE_KEYS.HOT_QUERIES}:`, '');
        hotQueries.push({ query, count: item.data });
      }
    }
    return hotQueries.sort((a, b) => b.count - a.count).slice(0, limit);
  }

  /**
   * Cache filter metadata (categories, companies)
   */
  async setFilterMetadata(
    type: 'categories' | 'companies',
    data: any[],
  ): Promise<void> {
    const key =
      type === 'categories'
        ? this.CACHE_KEYS.FILTER_CATEGORIES
        : this.CACHE_KEYS.FILTER_COMPANIES;

    this.set(key, data, this.CACHE_TTL.FILTERS);
  }

  /**
   * Get cached filter metadata
   */
  async getFilterMetadata(
    type: 'categories' | 'companies',
  ): Promise<any[] | null> {
    const key =
      type === 'categories'
        ? this.CACHE_KEYS.FILTER_CATEGORIES
        : this.CACHE_KEYS.FILTER_COMPANIES;

    return this.get(key);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all job search related cache
   */
  async clearJobSearchCache(): Promise<void> {
    await this.invalidateByPattern('job-search');
    await this.invalidateByPattern('job-suggestions');
  }

  /**
   * Get from cache
   */
  private get<T = any>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  /**
   * Set cache item
   */
  private set(key: string, data: any, ttlMs: number): void {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { data, expiry });
  }

  /**
   * Check if cache item is expired
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.expiry;
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<{
    searchHits: number;
    suggestionHits: number;
    totalKeys: number;
  }> {
    let searchKeys = 0;
    let suggestionKeys = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(this.CACHE_KEYS.SEARCH)) searchKeys++;
      if (key.startsWith(this.CACHE_KEYS.SUGGESTIONS)) suggestionKeys++;
    }

    return {
      searchHits: searchKeys,
      suggestionHits: suggestionKeys,
      totalKeys: this.cache.size,
    };
  }
}
