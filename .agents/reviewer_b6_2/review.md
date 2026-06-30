# Batch 6 Review Report: Live Streaming & Video Platform

## Review Summary

**Verdict**: REQUEST_CHANGES (INTEGRITY VIOLATION)

The Batch 6 implementation provides a highly interactive and real-time live streaming platform experience using Socket.IO and Prisma with SQLite. The E2E tests verify that the main functional requirements (broadcast registration, predictions, gifting, clips, co-hosting) pass successfully under clean conditions.

However, several critical integrity, security, and transaction safety issues have been identified, including a bypass of database persistence for chat comments, cosmetic facade tab components, authorization bypasses in co-hosting, and parallel execution of payouts outside of database transactions. Consequently, changes are requested before approval can be granted.

---

## Findings

### [Critical - INTEGRITY VIOLATION] Volatile In-Memory Chat Storage Bypassing SQLite DB

- **What**: Live stream chat comments are stored purely in an volatile, in-memory `Map` inside the Next.js API route handler, completely bypassing database persistence.
- **Where**: `src/app/api/live/streams/[id]/chat/route.ts` (lines 14, 34, 167-187)
- **Why**: This violates the persistence contract in `PROJECT.md` ("No fake simulation panels that bypass DB/UI logic. All inputs must save to SQLite."). Because Next.js serverless/API routes recompile and scale dynamically, this in-memory map will lose all history on server restarts, recompilations, or in multi-instance deployments.
- **Suggestion**: Create a proper DB model (e.g., `LiveStreamComment` or `LiveStreamChatMessage`) in `prisma/schema.prisma` and persist all chat messages to the SQLite database.

### [Critical - INTEGRITY VIOLATION] Cosmetic Facade Tabs in Sidebar Interaction Panel

- **What**: The sidebar navigation tabs "Chat & Interactive" and "Clips & VODs" are hardcoded cosmetic buttons. Clicking them does not toggle the sidebar view. Instead, all widgets (chat, predictions, co-hosting, and clips) are stacked vertically in the sidebar at all times.
- **Where**: `src/app/(main)/live/page.tsx` (lines 796-800, 802-1043)
- **Why**: This is a facade implementation that mimics a tabbed UI without implementing any real layout or toggle logic, resulting in poor code quality and a confusing user experience.
- **Suggestion**: Implement state tracking (e.g., `const [sidebarTab, setSidebarTab] = useState<'chat' | 'clips'>('chat')`) and conditionally render only the active tab's widgets.

### [Major] Authorization Bypass & Missing Invite Check in Co-Hosting ACCEPT Action

- **What**: The co-hosting endpoint automatically adds any requesting user as a co-host when they call POST with `{ action: 'ACCEPT' }`, without validating if they were previously invited by the stream host.
- **Where**: `src/app/api/live/streams/[id]/cohost/route.ts` (lines 61-75)
- **Why**: This allows any logged-in user to force-join any active stream as a co-host, completely bypassing host authorization. Additionally, since the `INVITE` action immediately creates the `LiveStreamCoHost` record, a user is rendered in split-screen layout as soon as they are invited, before they have accepted.
- **Suggestion**: Add a status field (e.g., `status: 'PENDING' | 'ACCEPTED'`) to the `LiveStreamCoHost` model, or check against a pending invite list. Ensure a valid pending invite exists before allowing the `ACCEPT` action.

### [Major] Parallel Payout Updates Outside of Database Transactions

- **What**: Prediction resolution and cancellation payout updates to user point balances are executed in parallel using `Promise.all` outside of a database transaction.
- **Where**: `src/app/api/live/streams/[id]/predictions/route.ts` (lines 262-290, 339-350)
- **Why**: If a database error occurs or the server restarts mid-execution, some users will be paid/refunded while others will not. Because the prediction status update to `RESOLVED` or `CANCELLED` is performed separately after the loop, the host could re-run the resolution, leading to double-spending and points duplication.
- **Suggestion**: Wrap all points updates and the status update in a Prisma `$transaction` block to guarantee atomicity.

### [Minor] Typo Bug in Live Stream Gift API Response Mapping

- **What**: The `displayName` of the gift sender returned in the API response is set to the user's remaining points balance (`updatedUser.channelPoints`) instead of their display name.
- **Where**: `src/app/api/live/streams/[id]/gifts/route.ts` (line 100)
- **Why**: Returns a numeric points balance under the sender display name field to the client, leading to UI display bugs if used directly.
- **Suggestion**: Change to `displayName: updatedUser.displayName` or `displayName: user.displayName`.

### [Minor] Missing User Verification on Co-Host Invites

- **What**: The `INVITE` action does not check if the target `userId` exists in the database.
- **Where**: `src/app/api/live/streams/[id]/cohost/route.ts` (lines 38-59)
- **Why**: Inviting an invalid ID throws a foreign key constraint violation in Prisma, returning a generic 500 Internal Server Error instead of a clean 400 Bad Request.
- **Suggestion**: Query the user model to verify that `userId` exists before performing the upsert.

### [Minor] Absence of Focus Rings and ARIA Markup (Accessibility)

- **What**: Focus outline styles are stripped (`focus:outline-none`), navigation/filters lack ARIA roles (`role="tablist"`/`role="tab"`), live chat lacks an `aria-live` region, and floating animators lack `aria-hidden` attributes.
- **Where**: `src/app/(main)/live/page.tsx` (lines 782, 1006, 1065, 1081)
- **Why**: Hinders keyboard navigation and screen readers, violating WCAG AA accessibility standards.
- **Suggestion**: Restore standard focus indicators and add semantic ARIA attributes.

### [Minor] Missing Sidebar Height Constraints on Mobile Layout (Responsiveness)

- **What**: On mobile layout (`flex-col`), the sidebar has no max-height or height limit set, causing it to expand completely and push interactive components (like chat inputs and clips) off the viewport.
- **Where**: `src/app/(main)/live/page.tsx` (line 796)
- **Why**: Breaks layout responsiveness on smaller portrait screens.
- **Suggestion**: Add mobile-responsive height constraints (e.g. `max-h-[50vh] lg:max-h-none`) and make sure the sidebar container is properly scrollable.

---

## Verified Claims

- **Batch 6 database models exist in Prisma** → verified via checking `prisma/schema.prisma` lines 557-680 → **PASS**
- **E2E test suite executes and passes** → verified by running `node tests/e2e_runner.js` → **PASS**
- **Unified predictions endpoint handles actions** → verified via checking `src/app/api/live/streams/[id]/predictions/route.ts` → **PASS**
- **Cohosting API allows invite/leave actions** → verified via checking `src/app/api/live/streams/[id]/cohost/route.ts` → **PASS**
- **Stream creation and detail fetching APIs work** → verified via checking `src/app/api/live/streams/route.ts` and `[id]/route.ts` → **PASS**

---

## Coverage Gaps

- **Real Video Streaming Server Integration** — risk level: low (acceptable mock representation) — recommendation: accept risk. The project utilizes a frontend simulated studio player with animated icons to display co-hosting layout changes which is standard for local test execution.

---

## Unverified Items

- **Actual production Socket.IO connection scaling** — reason not verified: socket connection is verified locally on `server.ts` but cannot be stress-tested for load, concurrency, or multi-instance sync.
