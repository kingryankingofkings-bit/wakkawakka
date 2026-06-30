# Implementation Plan — worker_b6_remediation_2

## Outcomes

- Fix API authorization check, Gifts NaN validation, and Prediction Bets point types to resolve security/validation vulnerabilities.
- Add keyboard accessibility styling (focus-visible outlines) to Sidebar, MobileNav, and Live page elements.
- Implement ARIA tab semantics for Live Browse status switcher and Live Watch sidebar tab-panel linkages.
- Fix mobile scrolling touch conflicts and squashing on the Live Watch comments component.
- Create Next.js `not-found` page component to solve build page module errors.
- Ensure type-checks, linters, production builds, and E2E runner tests pass with 0 errors.

## In-Scope

1. **API Security Validation**:
   - `src/app/api/live/streams/[id]/cohost/route.ts`: Validate that `targetUserId === requesterId` in ACCEPT action.
   - `src/app/api/live/streams/[id]/gifts/route.ts`: Check `isNaN` on converted values of `amount` and `quantity`.
   - `src/app/api/live/streams/[id]/predictions/route.ts`: Strict check on `typeof points === 'number'`, arrays/objects, non-integers, positive values.
2. **Focus Outlines (Tailwind)**:
   - `src/components/layout/Sidebar.tsx`: Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to buttons, links, theme switch.
   - `src/components/layout/MobileNav.tsx`: Same outlines on mobile nav buttons/links.
   - `src/app/(main)/live/page.tsx`: Same outlines on Browse categories and status switcher tabs.
3. **ARIA Semantics**:
   - `src/app/(main)/live/page.tsx`: Add `role="tablist"`, `role="tab"`, and `aria-selected` to Live Browse status switcher. Add `id` / `aria-controls` to Watch sidebar buttons and `role="tabpanel"` / `aria-labelledby` to their active containers.
4. **Mobile Scroll & Height Fixes**:
   - `src/app/(main)/live/page.tsx`: Remove `overflow-y-auto` from intermediate sidebar containers. Use flexible viewport height (`h-[50vh] min-h-[450px] lg:h-auto lg:min-h-0 lg:max-h-none`) and ensure comments do not squash under 150px.
5. **Next.js 404 Route**:
   - `src/app/not-found.tsx`: Basic React component for custom 404.

## Non-Goals & Do-Not-Touch List

- Do not modify databases or Prisma schemas.
- Do not perform styling refactoring outside of the explicitly requested elements.
- Do not change auth or state stores outside of standard local updates.

## Files to Touch

- `src/app/api/live/streams/[id]/cohost/route.ts`
- `src/app/api/live/streams/[id]/gifts/route.ts`
- `src/app/api/live/streams/[id]/predictions/route.ts`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/MobileNav.tsx`
- `src/app/(main)/live/page.tsx`
- `src/app/not-found.tsx`

## Test Plan & Acceptance Criteria

- Run `npm run type-check` to verify typescript compilation.
- Run `npm run lint` to verify lint rules.
- Run `npm run build` to verify Next.js build compilation.
- Run `node tests/e2e_runner.js` to run the 13 e2e tests.
- Verify focus state outline visually matches requirements.
