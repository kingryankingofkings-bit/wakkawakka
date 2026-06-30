## 2026-06-30T14:46:18Z

You are teamwork_preview_worker (worker_b6_remediation_2). Your working directory is C:\Users\Kingr\OneDrive\Documents\wakkawakka-local.
Your role is to apply final Batch 6 fixes to resolve security, accessibility, responsiveness, and Next.js build compile failures.

Here is the precise set of required changes:

1. **Security & API Validation Fixes**:
   - **Co-hosting Auth Check (`src/app/api/live/streams/[id]/cohost/route.ts`)**: In the `ACCEPT` action handler, verify that `targetUserId === requesterId` (where `requesterId` is retrieved from `getRequestUserId(req)`). Return a 403 Forbidden error response if a user tries to accept an invitation on behalf of someone else.
   - **Gifts NaN Validation (`src/app/api/live/streams/[id]/gifts/route.ts`)**: In the inputs validation block, perform strict numeric checks on `amount` and `quantity` using `isNaN()` in addition to positive checks, ensuring values like "NaN" or non-numeric strings are rejected with a 400 response.
   - **Prediction Bets type checks (`src/app/api/live/streams/[id]/predictions/route.ts`)**: Enforce strict validation of `points` to ensure it is a primitive number (`typeof points === 'number'`) and check array/objects before verifying integer states.

2. **Accessibility & Focus Indicators**:
   - **Navigation Focus (`src/components/layout/Sidebar.tsx` and `src/components/layout/MobileNav.tsx`)**: Restore focus-visible outline indicators to all interactive nav elements, buttons (e.g. create post, settings, theme toggle, logout), and avatar/profile links using Tailwind focus utilities (e.g. `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`).
   - **Live Page Browse Focus (`src/app/(main)/live/page.tsx`)**: Add focus outline indicators (e.g. `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`) to category selector buttons and status tabs in Browse Mode.
   - **ARIA Tab Semantics (`src/app/(main)/live/page.tsx`)**:
     - Live Browse status switcher tabs: add standard ARIA roles (`role="tablist"`, `role="tab"`, and `aria-selected` attributes).
     - Live Watch sidebar tabs: implement complete tabpanel linkages (add matching `id` and `aria-controls` properties to the buttons, and apply `role="tabpanel"` and `aria-labelledby` to the parent containers of the active panel views).

3. **Mobile Layout Scroll & Height Fixes (`src/app/(main)/live/page.tsx`)**:
   - Remove redundant `overflow-y-auto` styles from the intermediate sidebar containers (leaving only the comment list container scrollable to avoid mobile touch-screen scroll-chaining conflicts).
   - Adjust height constraints on mobile layouts (remove rigid `max-h-[50vh]` and replace with flexible viewport heights, ensuring layout elements adjust cleanly and comments aren't squashed under 150px).

4. **Next.js Production Build Fix**:
   - Create a basic React component page at `src/app/not-found.tsx` to handle 404 page routing and resolve the Next.js `PageNotFoundError: Cannot find module for page: /_not-found` build-time error.

5. **Static Checks & Build compilation**:
   - Run typescript compilation (`npm run type-check`), linter (`npm run lint`), and Next.js build compilation (`npm run build`) to ensure the build succeeds with 0 errors.
   - Execute the test runner (`node tests/e2e_runner.js`) to confirm all 13 tests pass.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Provide a handoff.md report summarizing your changes and verification logs.
