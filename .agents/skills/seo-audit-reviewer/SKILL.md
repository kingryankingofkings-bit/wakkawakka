---
name: seo-audit-reviewer
description: Use when auditing websites for SEO issues, checking search engine visibility, fixing indexing problems, or optimizing for organic search. Triggers on requests like "SEO audit", "not showing in Google", "indexing issue", "meta tags broken", "sitemap problem", "crawl error", "search ranking", "SEO fix", or when search visibility needs improvement. Provides technical SEO checklists and diagnostic workflows.
---

# SEO Audit Reviewer

## Goal

Audit and fix technical SEO issues that prevent search engines from properly crawling and indexing the site.

## Do Not Use When

- SEO is already audited and healthy
- The request is for content SEO (keywords, copywriting)

## Required Inputs To Inspect

- Site URL
- Google Search Console data (if available)
- Sitemap
- Robots.txt
- Page structure

## Audit Checklist

### Crawlability

- [ ] Robots.txt not blocking important pages
- [ ] Sitemap submitted to Google
- [ ] No crawl errors in Search Console
- [ ] Internal links work (no orphan pages)

### Indexing

- [ ] Pages have canonical URLs
- [ ] No duplicate content issues
- [ ] Meta robots tag correct
- [ ] Structured data validates

### Mobile

- [ ] Mobile-friendly (Google Mobile-Friendly Test)
- [ ] Viewport meta tag present
- [ ] Touch targets adequate

### Performance

- [ ] Core Web Vitals pass
- [ ] Page speed acceptable

### Content

- [ ] Title tags unique and descriptive
- [ ] Meta descriptions present
- [ ] Heading hierarchy correct (H1 → H2 → H3)
- [ ] Images have alt text
- [ ] Internal linking present

## Coordinates With

- `seo-structured-data-builder` — for structured data fixes
- `performance-audit-optimizer` — for speed fixes
