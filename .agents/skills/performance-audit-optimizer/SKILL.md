---
name: performance-audit-optimizer
description: Use when auditing website performance, optimizing load times, improving Core Web Vitals, reducing bundle sizes, or diagnosing slow pages. Triggers on requests like "slow website", "performance audit", "optimize loading", "Core Web Vitals", "LCP", "FID", "CLS", "bundle size", "lazy loading", "code splitting", "caching strategy", "speed up", or when page speed needs improvement. Provides measurement tools and optimization strategies for frontend performance.
---

# Performance Audit and Optimizer

## Goal

Audit and optimize website performance for fast loading and smooth interaction.

## Do Not Use When

- Performance is already measured and acceptable
- The issue is backend/server performance (use backend monitoring)

## Required Inputs To Inspect

- Lighthouse scores
- Core Web Vitals (LCP, INP, CLS)
- Bundle analysis
- Network waterfall
- Performance profile

## Audit Workflow

1. **Measure**: Lighthouse, PageSpeed Insights, Web Vitals Extension
2. **Analyze bundle**: `webpack-bundle-analyzer` or `@vite-bundle-analyzer`
3. **Check images**: Unoptimized images are the #1 cause of slow LCP
4. **Check JavaScript**: Bundle size, unused code, long tasks
5. **Check fonts**: Subset fonts, use `font-display: swap`
6. **Check caching**: Cache headers, service worker
7. **Prioritize**: Fix highest impact, lowest effort first

## Optimization Checklist

### Images

- [ ] WebP format
- [ ] Responsive sizes (srcset)
- [ ] Lazy loading below fold
- [ ] Proper dimensions specified

### JavaScript

- [ ] Code splitting (route-based)
- [ ] Tree shaking working
- [ ] Third-party scripts deferred
- [ ] No unused dependencies

### CSS

- [ ] Critical CSS inlined
- [ ] Unused CSS purged
- [ ] CSS not blocking render

### Fonts

- [ ] `font-display: swap`
- [ ] Subset to used characters
- [ ] Preload critical fonts

## Target Metrics

| Metric | Good    | Needs Improvement | Poor    |
| ------ | ------- | ----------------- | ------- |
| LCP    | < 2.5s  | < 4s              | > 4s    |
| INP    | < 200ms | < 500ms           | > 500ms |
| CLS    | < 0.1   | < 0.25            | > 0.25  |

## Coordinates With

- `frontend-scaffold-builder` — for build optimization
- `animation-interaction-builder` — for animation performance
- `cache-and-data-fetching-strategy` — for caching
