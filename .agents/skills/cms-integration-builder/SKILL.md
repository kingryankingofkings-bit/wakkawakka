---
name: cms-integration-builder
description: Use when integrating content management systems, connecting headless CMS platforms, building content-driven websites, or enabling non-technical content editing. Triggers on requests like "add a CMS", "headless CMS", "contentful", "Sanity", "Strapi", "WordPress headless", "content editing", "blog posts from CMS", "dynamic content", or when content needs to be managed outside the codebase. Provides integration patterns for Sanity, Contentful, Strapi, WordPress, and MDX-based content.
---

# CMS Integration Builder

## Goal
Integrate headless CMS platforms for content-driven websites with proper data fetching, caching, and preview modes.

## Do Not Use When
- Content is static and rarely changes
- All content is user-generated
- Using a page builder exclusively (Webflow, etc.)

## Required Inputs To Inspect
- CMS platform choice (Sanity, Contentful, Strapi, WordPress, MDX)
- Content types needed (blog posts, pages, products)
- Preview/draft mode requirements
- Real-time needs
- Editor skill level

## Workflow

1. **Set up CMS**: Create project, define content types
2. **Install SDK**: Client library for the chosen CMS
3. **Define queries**: GraphQL or REST queries for each content type
4. **Implement fetching**: Server-side fetching with caching
5. **Add preview mode**: Draft/preview for content editors
6. **Set up webhooks**: Revalidate cache on content changes
7. **Build components**: Map CMS fields to UI components
8. **Add image optimization**: Use CMS image APIs for resizing
9. **Handle rich text**: Serialize rich text to components
10. **Train editors**: Document content creation process

## Quality Checks
- [ ] Content updates reflect quickly (< 60 seconds)
- [ ] Preview mode works for drafts
- [ ] Rich text renders correctly
- [ ] Images are optimized
- [ ] 404 handled for deleted content

## Safety Rules
- Sanitize rich text content (XSS prevention)
- Rate limit CMS API calls
- Handle CMS downtime gracefully (cache fallback)
- Don't expose CMS tokens client-side

## Coordinates With
- `frontend-scaffold-builder` — for SDK setup
- `cache-and-data-fetching-strategy` — for content caching
- `third-party-api-integration` — for CMS API calls
