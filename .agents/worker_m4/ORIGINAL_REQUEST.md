## 2026-06-30T10:02:05Z
You are teamwork_preview_worker. Your working directory is C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_m4.

Your task is to implement the REAL, integrated, database-backed features for Batch 3 (Content Creation, Feeds & Discovery).

Follow these exact steps:

1. Database Schema Updates:
   - Modify `prisma/schema.prisma` to:
     - Add `scheduledAt DateTime?` field to the `Post` model.
     - Add a `SearchHistory` model:
       ```prisma
       model SearchHistory {
         id        String   @id @default(cuid())
         userId    String
         user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
         query     String
         createdAt DateTime @default(now())

         @@index([userId])
         @@index([createdAt])
       }
       ```
     - Add relation `searchHistories SearchHistory[]` to the `User` model.
   - Run `npx prisma db push` to synchronize changes with SQLite dev database.

2. Implement Ephemeral Stories:
   - Create `/api/stories/route.ts`:
     - GET: Fetches active stories from followed users and self that are less than 24 hours old (`expiresAt > now`).
     - POST: Creates a new `Story` with mediaUrl, type (IMAGE/VIDEO), caption, duration (default 5s), and expiresAt (now + 24 hours).
   - Create `/api/stories/[id]/view/route.ts` with a POST method:
     - Creates a `StoryView` record mapping `storyId` and active `viewerId` to mark a story as read.
   - Update `StoriesRow.tsx` to fetch active stories via `apiFetch('/api/stories')`, group them by author, and display a colored border ring (active colored gradient if the author has any unviewed stories, or gray border if all are viewed).
   - Update `StoryViewer.tsx` to POST to `/api/stories/[id]/view` on story display, and animate the duration slider using the custom story duration parameter.

3. Implement Advanced Feeds & Comments:
   - In `/api/posts/route.ts` GET method:
     - Implement "For You" sorting using a decay algorithm score:
       `score = ((viewsCount * 0.1) + (likesCount * 1.5) + (commentsCount * 3.0) + (sharesCount * 5.0)) / Math.pow(ageInHours + 2, 1.5)`.
     - Filter out scheduled posts whose `scheduledAt` is set in the future.
   - In `/api/posts/[id]/react/route.ts`, ensure post interaction count adjustments (like increments/decrements) are done atomically in the Prisma update.
   - Create endpoint `/api/posts/[id]/comments/route.ts`:
     - GET: Returns root comments for the post (`parentId == null`), including author metadata and nested replies.
     - POST: Saves a comment or reply (with `parentId`) and atomically increments `commentsCount` on the post in the database.
   - Update `CommentsSection.tsx` on the frontend to fetch and save comments using this new database API.

4. Implement Database-driven Search & Tags:
   - Update `/api/search/route.ts` to perform database-level Prisma text-contain searches on `User`, `Post`, and `Community`.
   - Save the query string into the `SearchHistory` table in the database for the active user.
   - Filter search results to exclude blocked users or post authors.
   - Support tags/hashtags querying matching the exploration filters.

5. Implement Content Creation & Reels:
   - Update `/reels/page.tsx` on the frontend to fetch posts of type `'REEL'` from the database (via `/api/posts?type=REEL`) and render them.
   - Update `CreatePostModal.tsx` uploader:
     - When "Reel" tab is active, restrict file drop to video formats (`.mp4`, `.webm`).
     - Display a textfield adjacent to each uploaded media file to enter optional alt-text description (serialized as JSON `{url, altText}` in mediaUrls).
     - Add a datepicker component to select a scheduled publication date/time (persisted as `scheduledAt` in the DB).

6. Verification & Validation:
   - Ensure all files are cleanly formatted and type checked.
   - Run type-check (`npm run type-check`), linting (`npm run lint`), and build verification (`npm run build`).
   - Run tests: `node tests/e2e_runner.js`. All tests must pass successfully.
   - Create a section for Batch 3 Features in `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\integration_inventory.md` and set status to "Implemented".

Write a detailed handoff report in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_m4\handoff.md and message us when done.
