---
name: seo-structured-data-builder
description: Use when implementing SEO optimizations, adding structured data/schema markup, configuring meta tags, managing robots.txt, creating sitemaps, or improving search engine visibility. Triggers on requests like "SEO", "meta tags", "structured data", "schema markup", "sitemap", "robots.txt", "Open Graph", "Twitter cards", "search optimization", or when building public-facing sites that need search visibility. Framework-aware for Next.js, Nuxt, SvelteKit SEO patterns.
---

# SEO and Structured Data Builder

## Goal

Implement comprehensive SEO with proper meta tags, structured data, sitemaps, and social sharing optimization.

## Do Not Use When

- Site is not public (internal tools, dashboards)
- SEO is already implemented and audited

## Required Inputs To Inspect

- Site structure and pages
- Target keywords (if known)
- Social sharing requirements
- Content types needing structured data
- Localization/multilingual needs

## Workflow

1. **Meta tags**: Title (50-60 chars), description (150-160 chars), canonical
2. **Open Graph**: og:title, og:description, og:image for social sharing
3. **Twitter Cards**: Summary or summary_large_image
4. **Structured data**: JSON-LD for relevant schemas
5. **Sitemap**: XML sitemap with all pages
6. **Robots.txt**: Allow/disallow rules
7. **Canonical URLs**: Prevent duplicate content
8. **Hreflang**: For multilingual sites
9. **Semantic HTML**: Proper heading hierarchy, nav, main, article
10. **Core Web Vitals**: LCP, FID, CLS optimization

## Common Schema Types

| Type           | Use Case               |
| -------------- | ---------------------- |
| WebSite        | Homepage               |
| WebPage        | All pages              |
| Article        | Blog posts             |
| Product        | Product pages          |
| FAQPage        | FAQ sections           |
| BreadcrumbList | Navigation breadcrumbs |
| Organization   | About page             |

## Quality Checks

- [ ] Every page has unique title and description
- [ ] Structured data validates (Google Rich Results Test)
- [ ] Sitemap submitted to Google Search Console
- [ ] Social sharing previews work
- [ ] No duplicate content issues

## Safety Rules

- Don't stuff keywords
- Use descriptive, not deceptive titles
- Don't cloak content (show different to bots vs users)

## Coordinates With

- `information-architecture-planner` — for URL structure
- `frontend-routing-navigation` — for dynamic meta tags
- `performance-audit-optimizer` — for Core Web Vitals
