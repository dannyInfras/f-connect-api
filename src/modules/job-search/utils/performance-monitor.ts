/**
 * Performance monitoring utility for job search operations
 * Tracks search times, cache hit rates, and query patterns
 */
export class JobSearchPerformanceMonitor {
  private static instance: JobSearchPerformanceMonitor;
  private metrics: Map<string, any> = new Map();

  private constructor() {
    // Singleton pattern for global metrics tracking
  }

  static getInstance(): JobSearchPerformanceMonitor {
    if (!JobSearchPerformanceMonitor.instance) {
      JobSearchPerformanceMonitor.instance = new JobSearchPerformanceMonitor();
    }
    return JobSearchPerformanceMonitor.instance;
  }

  /**
   * Start timing a search operation
   */
  startTimer(operationId: string): void {
    this.metrics.set(`${operationId}_start`, Date.now());
  }

  /**
   * End timing and record duration
   */
  endTimer(operationId: string, metadata?: any): number {
    const startTime = this.metrics.get(`${operationId}_start`);
    if (!startTime) {
      return 0;
    }

    const duration = Date.now() - startTime;
    this.recordMetric('search_duration', duration, metadata);
    this.metrics.delete(`${operationId}_start`);

    return duration;
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(cacheKey: string, hit: boolean): void {
    const cacheMetrics = this.metrics.get('cache_stats') || {
      hits: 0,
      misses: 0,
    };

    if (hit) {
      cacheMetrics.hits++;
    } else {
      cacheMetrics.misses++;
    }

    this.metrics.set('cache_stats', cacheMetrics);
  }

  /**
   * Record search query pattern
   */
  recordQueryPattern(pattern: {
    hasTextSearch: boolean;
    hasFilters: boolean;
    filterCount: number;
    resultCount: number;
  }): void {
    const patterns = this.metrics.get('query_patterns') || [];
    patterns.push({
      ...pattern,
      timestamp: new Date(),
    });

    // Keep only last 1000 patterns
    if (patterns.length > 1000) {
      patterns.shift();
    }

    this.metrics.set('query_patterns', patterns);
  }

  /**
   * Record general metric
   */
  recordMetric(name: string, value: any, metadata?: any): void {
    const metricHistory = this.metrics.get(name) || [];
    metricHistory.push({
      value,
      metadata,
      timestamp: new Date(),
    });

    // Keep only last 100 entries per metric
    if (metricHistory.length > 100) {
      metricHistory.shift();
    }

    this.metrics.set(name, metricHistory);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    avgSearchTime: number;
    cacheHitRate: number;
    totalSearches: number;
    slowQueries: number;
  } {
    const searchDurations = this.metrics.get('search_duration') || [];
    const cacheStats = this.metrics.get('cache_stats') || {
      hits: 0,
      misses: 0,
    };

    const avgSearchTime =
      searchDurations.length > 0
        ? searchDurations.reduce(
            (sum: number, entry: any) => sum + entry.value,
            0,
          ) / searchDurations.length
        : 0;

    const totalCacheRequests = cacheStats.hits + cacheStats.misses;
    const cacheHitRate =
      totalCacheRequests > 0 ? (cacheStats.hits / totalCacheRequests) * 100 : 0;

    const slowQueries = searchDurations.filter(
      (entry: any) => entry.value > 1000,
    ).length;

    return {
      avgSearchTime: Math.round(avgSearchTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalSearches: searchDurations.length,
      slowQueries,
    };
  }

  /**
   * Get popular search patterns
   */
  getPopularPatterns(): Array<{
    pattern: string;
    count: number;
    avgTime: number;
  }> {
    const patterns = this.metrics.get('query_patterns') || [];
    const patternMap = new Map<string, { count: number; totalTime: number }>();

    patterns.forEach((pattern: any) => {
      const key = `hasText:${pattern.hasTextSearch},filters:${pattern.filterCount}`;
      const existing = patternMap.get(key) || { count: 0, totalTime: 0 };
      existing.count++;
      // Approximate time based on complexity
      existing.totalTime += pattern.hasTextSearch ? 50 : 20;
      patternMap.set(key, existing);
    });

    return Array.from(patternMap.entries())
      .map(([pattern, stats]) => ({
        pattern,
        count: stats.count,
        avgTime: Math.round(stats.totalTime / stats.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): any {
    const metrics: any = {};
    for (const [key, value] of this.metrics.entries()) {
      metrics[key] = value;
    }
    return {
      ...metrics,
      summary: this.getPerformanceSummary(),
      exportedAt: new Date(),
    };
  }
}

/**
 * Performance decorator for automatic timing
 */
export function TrackPerformance(operationName: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const monitor = JobSearchPerformanceMonitor.getInstance();
      const operationId = `${operationName}_${Date.now()}`;

      monitor.startTimer(operationId);

      try {
        const result = await method.apply(this, args);
        const duration = monitor.endTimer(operationId, { success: true });

        // Log slow operations
        if (duration > 1000) {
          console.warn(
            `Slow operation detected: ${operationName} took ${duration}ms`,
          );
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        monitor.endTimer(operationId, { success: false, error: errorMessage });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Get performance monitor instance
 */
export const performanceMonitor = JobSearchPerformanceMonitor.getInstance();
