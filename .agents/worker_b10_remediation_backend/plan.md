# Implementation Plan - Batch 10 Remediation Backend

## Outcomes
- Secured disappearing media endpoints by ensuring requesting user is either the sender or receiver.
- Integrated `SavedMemory` Prisma model in memories API routes for listing, creating, and deleting memories.
- Successful verification with project build and test scripts.

## In-Scope
- Modify `src/app/api/media/disappearing/[id]/route.ts` to add sender/receiver authorization checks.
- Modify `src/app/api/media/disappearing/[id]/view/route.ts` to add the same authorization checks.
- Modify `src/app/api/memories/route.ts` to implement GET (optional `onThisDay` filtering, parsing caption JSON) and POST (metadata serialization in caption JSON) using the `SavedMemory` model.
- Create `src/app/api/memories/[id]/route.ts` to implement DELETE with ownership validation.

## Non-Goals
- Any UI/frontend improvements in the Memories page.
- Modification of other unrelated API endpoints.
- DB migration changes (we assume `SavedMemory` model already exists in the SQLite/postgres schema and client).

## Do-Not-Touch List
- Frontend pages unless specifically requested.
- Any other API folders like `location`, `streaks`, `posts`.

## Files to Touch
- `src/app/api/media/disappearing/[id]/route.ts`
- `src/app/api/media/disappearing/[id]/view/route.ts`
- `src/app/api/memories/route.ts`
- `src/app/api/memories/[id]/route.ts` (new)

## Data/Interface Contracts
- GET `/api/media/disappearing/[id]`
  - Request: Header `x-user-id` (authenticated user).
  - Response: 403 if user is neither sender nor receiver. 410 if already viewed. 404 if not found.
- POST `/api/media/disappearing/[id]/view`
  - Request: Header `x-user-id`.
  - Response: 403 if user is neither sender nor receiver.
- GET `/api/memories`
  - Query: `onThisDay=true` (optional).
  - Response: `{ data: Memory[], meta: { total: number } }` where `Memory` has `id, url, pipUrl, mode, date, createdAt, location, tags`.
- POST `/api/memories`
  - Request body: `{ url, pipUrl, mode, location, tags, latitude, longitude }`
  - Response: `{ data: Memory }` (201 Created)
- DELETE `/api/memories/[id]`
  - Request: Header `x-user-id`.
  - Response: `{ success: true }` (200 OK), or 403 if forbidden, or 404 if not found.

## Test Plan
- Run existing integration tests: `node tests/camera_ar_test.js`
- Create a temporary/adhoc script `tests/memories_test.js` to verify GET, POST, and DELETE for memories, and clean up.
- Verify production build compilation: `npm run build` or equivalent.
