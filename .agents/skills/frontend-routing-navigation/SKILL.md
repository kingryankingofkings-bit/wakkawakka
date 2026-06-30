---
name: frontend-routing-navigation
description: Use when implementing client-side routing, navigation structures, route guards, dynamic routes, or URL handling in web applications. Triggers on requests like "set up routing", "create pages", "dynamic routes", "route guards", "navigation menu", "active link styling", "protected routes", or when building multi-page applications. Framework-aware for Next.js, Nuxt, SvelteKit, React Router, Vue Router.
---

# Frontend Routing and Navigation

## Goal
Implement clear, predictable routing with proper navigation patterns and route guards.

## Do Not Use When
- Single page with no navigation
- Routing is already set up
- The task is backend API routing

## Required Inputs To Inspect
- `information-architecture.md` for page structure
- Framework routing conventions
- Authentication requirements (protected routes)
- Dynamic route patterns (slugs, IDs)
- Layout requirements (shared layouts)

## Workflow

1. **Define routes**: Map each page to a URL path
2. **Group by layout**: Routes sharing layouts (dashboard, marketing)
3. **Implement dynamic routes**: `[id]`, `[slug]` with proper typing
4. **Add route guards**: Auth checks, role checks before rendering
5. **Handle loading states**: Show skeleton while route loads
6. **Handle errors**: 404 page, error boundaries
7. **Scroll management**: Scroll to top on navigation
8. **Active states**: Highlight current nav item
9. **Prefetching**: Prefetch routes on hover (Next.js, etc.)
10. **Meta management**: Dynamic titles, descriptions per route

## Quality Checks
- [ ] All IA pages have routes
- [ ] Dynamic routes are typed
- [ ] 404 page exists
- [ ] Protected routes redirect unauthenticated users
- [ ] Active nav state works
- [ ] Back button works correctly

## Safety Rules
- Never expose sensitive routes client-side (always verify server-side)
- Handle route param validation
- Don't break the back button

## Coordinates With
- `information-architecture-planner` — for page structure
- `authentication-authorization-builder` — for route guards
- `frontend-scaffold-builder` — for framework routing setup
