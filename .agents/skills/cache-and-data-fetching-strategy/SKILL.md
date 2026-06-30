---
name: cache-and-data-fetching-strategy
description: Use when designing caching strategies, optimizing data fetching, implementing stale-while-revalidate patterns, or reducing API latency. Triggers on requests like "cache data", "optimize fetching", "React Query", "SWR", "Redis cache", "CDN caching", "stale while revalidate", "reduce API calls", "data loading optimization", or when API performance needs improvement. Provides patterns for HTTP caching, application caching, and frontend data synchronization.
---

# Cache and Data Fetching Strategy

## Goal
Optimize data fetching with appropriate caching at every layer, minimizing latency and server load.

## Do Not Use When
- Data is always real-time (no caching possible)
- Performance is already acceptable

## Required Inputs To Inspect
- Data change frequency
- Read vs write ratio
- Acceptable staleness
- Cache infrastructure (Redis, CDN, browser)
- Framework capabilities

## Caching Layers

| Layer | Scope | TTL | Use Case |
|-------|-------|-----|----------|
| Browser | Per user | Session | Static assets, API responses |
| CDN | Global | Hours | Static pages, images |
| Application | All users | Minutes | Computed data, queries |
| Database | Server | Config | Query results |

## Workflow

1. **Identify cacheable data**: Rarely changing data (categories, settings)
2. **Choose cache type**: In-memory (node-cache), Redis, CDN, HTTP cache
3. **Set TTL**: Based on data change frequency
4. **Implement invalidation**: Tag-based, path-based, or time-based
5. **Use stale-while-revalidate**: Show cached data, refresh in background
6. **Add cache headers**: `Cache-Control`, `ETag`, `Last-Modified`
7. **Handle cache misses**: Graceful fallback to source
8. **Monitor hit rate**: Track cache effectiveness

## Frontend Data Fetching (React)

```tsx
// Using TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes
});
```

## Quality Checks
- [ ] Cache hit rate > 80%
- [ ] Stale data is refreshed in background
- [ ] Cache invalidation works correctly
- [ ] No cache stampede (thundering herd)
- [ ] Error states bypass cache

## Safety Rules
- Never cache user-specific data in shared caches without keys
- Always have cache bypass for debugging
- Set maximum TTL to prevent stale data indefinitely

## Coordinates With
- `backend-api-architect` — for cache headers
- `performance-audit-optimizer` — for performance tuning
