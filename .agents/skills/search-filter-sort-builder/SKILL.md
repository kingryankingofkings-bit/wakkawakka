---
name: search-filter-sort-builder
description: Use when implementing search functionality, filtering data, sorting results, pagination, or query builders in web applications. Triggers on requests like "add search", "filter results", "sort by", "pagination", "search bar", "advanced filters", "query builder", "full-text search", "faceted search", or when users need to find and narrow down data. Provides patterns for client-side, server-side, and full-text search implementations.
---

# Search, Filter, and Sort Builder

## Goal
Implement efficient search, filtering, and sorting with proper pagination and query optimization.

## Do Not Use When
- Static list with no search needs
- Using a dedicated search service (Algolia, Elasticsearch) — use `third-party-api-integration`

## Required Inputs To Inspect
- Data volume (hundreds, thousands, millions)
- Search requirements (exact, partial, fuzzy, full-text)
- Filter fields and types
- Sort options
- Latency requirements

## Decision: Client vs Server

| Data Volume | Search Type | Implementation |
|-------------|-------------|----------------|
| < 1000 rows | Simple | Client-side filtering |
| 1000-100K | Structured | Server-side query params |
| > 100K | Full-text | Dedicated search (Algolia, etc.) |

## Workflow

1. **Define search scope**: Which fields? Fuzzy or exact?
2. **Design filter UI**: Checkboxes, ranges, dropdowns, date pickers
3. **Build query params**: `?search=term&filter=value&sort=field&order=asc&page=1`
4. **Implement pagination**: Cursor-based (better) or offset-based
5. **Add debouncing**: 300ms delay on search input
6. **Optimize queries**: Add indexes on filtered/sorted columns
7. **Handle empty states**: No results message, clear filters
8. **URL sync**: Sync filters to URL for shareable links

## URL Pattern

```
/api/resources?search=iphone&category=phones&price_min=100&price_max=500&sort=price&order=asc&page=1&limit=20
```

## Quality Checks
- [ ] Search is debounced
- [ ] Pagination works correctly
- [ ] Filters combine correctly (AND logic)
- [ ] Empty states handled
- [ ] URL sync for shareable filtered views
- [ ] Loading state during search

## Safety Rules
- Sanitize search inputs (prevent injection)
- Limit max page size (prevent DOS)
- Index database columns used in filters

## Coordinates With
- `backend-api-architect` — for query endpoints
- `database-schema-designer` — for indexes
