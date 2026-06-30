# Handoff Report: Batch 9 Forum & Voting (Reddit-style) Implementation Strategy

This report outlines the codebase investigation and strategic recommendations for implementing the Reddit-style forum, voting, and moderation features (Batch 9).

## 1. Observation

Based on a thorough read-only investigation of the Wakka Wakka codebase, the following patterns, structures, and constraints were observed:

### A. Database and Schema Conventions
* **SQLite Database Engine**: The project uses SQLite for development, as declared in `prisma/schema.prisma` (lines 12-15):
  ```prisma
  datasource db {
    provider = "sqlite"
    url      = env("DATABASE_URL")
  }
  ```
* **No Native Enums**: SQLite does not support native enums. Enums are modeled as strings in the schema and validated at the application layer. This is documented in `prisma/schema.prisma` (lines 19-21):
  ```prisma
  // NOTE: SQLite does not support native enums. We model them as String and
  //       validate at the application layer. When migrating to PostgreSQL,
  //       convert these to proper Prisma enum declarations.
  ```
* **JSON Serialization**: JSON arrays and objects in SQLite are stored as strings (e.g., `mediaUrls`, `hashtags`, `skills`, `workHistory`) and default to stringified arrays `@default("[]")` or `@default("{}")`, which are parsed/stringified at the application layer.

### B. Authentication Patterns
* **User Identification**: API routes resolve the active user ID using the utility `getRequestUserId` from `src/lib/currentUser.ts` (lines 13-22):
  ```typescript
  export function getRequestUserId(
    req: NextRequest,
    bodyUserId?: string,
  ): string | null {
    const header = req.headers.get("x-user-id");
    if (header) return header;
    const q = req.nextUrl.searchParams.get("userId");
    if (q) return q;
    return bodyUserId ?? null;
  }
  ```
* **Authentication Gating**: Routes return `NextResponse.json({ error: "Not authenticated" }, { status: 401 })` if `getRequestUserId(req)` returns `null` (e.g., `src/app/api/communities/route.ts` line 111-113).

### C. Transaction and Atomic Patterns
* **Atomic Updates via Prisma Transactions**: Operations affecting multiple records (e.g. creating a group and adding the creator, or incrementing post likes while updating/creating a post reaction) are wrapped in `prisma.$transaction(async (tx) => { ... })`. For example, in `src/app/api/posts/[id]/react/route.ts` (lines 113-183):
  ```typescript
  const updatedPost = await prisma.$transaction(async (tx) => {
    const post = await tx.post.findUnique({ where: { id: postId } });
    ...
    const existingLike = await tx.like.findUnique({ ... });
    ...
    // Adjust like record & update post counter
    return await tx.post.update({ ... });
  });
  ```

### D. Socket.IO Real-time Architecture
* **Decoupled Real-time Relay**: The server setup in `server.ts` uses Socket.IO to listen to events emitted by the client and broadcast them to other clients in specific rooms (e.g., `join-server`, `send-server-message` in lines 165-198). The HTTP API routes themselves do not invoke Socket.IO directly; instead, they persist changes to the database and return the updated structures to the client, which subsequently emits socket events.

---

## 2. Logic Chain

From the observations above, the following logical steps dictate the implementation strategy:

1. **Schema Strategy**: Since SQLite lacks native enums and JSON fields, all enum-like fields (such as post types, vote types, member roles, and moderation actions) must be mapped to `String` in Prisma. Complex attributes (like custom themes, poll options, and poll votes) must be modeled as `String?` or `String` with `@default("[]")` or `@default("{}")` and processed using `JSON.parse` / `JSON.stringify` within the API logic.
2. **Atomic Voting Strategy**: Cast vote operations require a database transaction to prevent inconsistencies:
   * A post/comment upvote or downvote updates a `RedditVote` record (insert/update/delete).
   * Concurrently, the score of the target `SubredditPost` or `SubredditComment` must be updated (incremented/decremented).
   * Concurrently, the author's `redditKarma` field in the `User` model must be updated based on the delta (+1 for a new upvote, +2 when switching from downvote to upvote, etc.).
   * Execution must be consolidated in a `prisma.$transaction` block.
3. **Atomic Awards Strategy**: Giving a virtual award requires:
   * Checking that the sender has sufficient points (`channelPoints` in the `User` model) to pay for the award price.
   * Deducting the price from the sender's `channelPoints`.
   * Incrementing the receiver's `redditKarma` (using `karmaValue` based on the award price or a flat award bonus).
   * Creating a `RedditAward` record.
   * This multi-model write must also run inside a `prisma.$transaction`.
4. **Authorization & Access Gating**:
   * For moderation tools (`/api/reddit/mod`) and editing subreddits (`PATCH /api/reddit/subreddits/[id]`), the API must query `SubredditMember` to verify if the requesting `userId` has `role === 'MODERATOR'` or `role === 'ADMIN'`.
5. **Real-time Integration**: Following the decoupled Socket.IO architecture observed in `server.ts` and `src/app/api/messages/conversations/[id]/messages/route.ts`, the implementer should avoid writing server-side socket trigger endpoints. The HTTP REST APIs will perform standard DB updates and return JSON data, while the React frontend components will emit socket events (e.g. `reddit-vote`, `new-reddit-comment`) when these API endpoints return success.

---

## 3. Caveats

* **Points System for Awards**: We assume `channelPoints` on the `User` model represents the virtual currency balance used to purchase awards. If a separate points field is desired in the future, it would require modifying the `User` model further.
* **JSON Filtering in SQLite**: Since SQLite represents custom themes and poll options as text, Prisma cannot query inner properties of JSON fields using standard where clauses (e.g., filtering posts by specific poll option text). These filters must be performed programmatically in JS/TS or using simple string operations like `contains`.
* **Mod Actions Constraints**: Moderate actions (e.g. ban/mute) must set fields on `SubredditMember` (`isBanned: true`, `isMuted: true`) rather than deleting them, preserving audit logs.

---

## 4. Conclusion & Recommendations

### A. Prisma Schema Setup
Apply the changes in `prisma_schema.patch` (located in this directory) to include:
1. `User` update: Add `redditKarma Int @default(0)` along with relationship fields back to the new Reddit-style models.
2. New Models:
   * `Subreddit`: Tracks name, slug, description, rules, member/post counts, custom theme, and moderation states.
   * `SubredditMember`: Tracks membership role (MEMBER, MODERATOR, ADMIN), flairs, joined date, ban/mute states.
   * `SubredditPost`: Tracks title, content, type (TEXT, POLL, LINK, MEDIA), counts (upvotes, downvotes, score), flags (NSFW, spoiler, pin, AMA), and options for polls.
   * `SubredditComment`: Supports nested trees (recursive relation on `parentId`).
   * `RedditVote`: Tracks user votes on posts/comments. Unique constraint on `[userId, targetId, targetType]`.
   * `RedditAward`: Tracks virtual award transactions (sender, receiver, target post/comment, price).
   * `RedditCrosspost`: Tracks link associations between original posts and targets.
   * `RedditModAction`: Logs mod administrative tasks.

### B. Detailed API Endpoint Design

#### 1. Subreddit Management (`/api/reddit/subreddits`)
* **`POST /api/reddit/subreddits`**:
  - Authenticate requesting user.
  - Auto-generate `slug` from `name` (sanitize lowercase, hyphens).
  - Transactionally:
    1. Create `Subreddit` with default counts.
    2. Create `SubredditMember` with `role: "ADMIN"` for the creator.
  - Return created Subreddit details.
* **`GET /api/reddit/subreddits`**:
  - List all subreddits with optional search queries.
* **`GET /api/reddit/subreddits/[id]`**:
  - Support fetching by either `id` or `slug`. Include memberships and custom style themes.
* **`PATCH /api/reddit/subreddits/[id]`**:
  - Retrieve requester's role in `SubredditMember`. Allow changes only if role is `ADMIN` or `MODERATOR`.
  - Allow updating `description`, `rules`, `customTheme`, `isNSFW`, and `isSpoiler`.

#### 2. Post Feeds, Creation, and Detail Routes (`/api/reddit/posts`)
* **`POST /api/reddit/posts`**:
  - Require body fields: `title`, `subredditId`, `type` (TEXT, POLL, LINK, MEDIA), and content/media details.
  - For POLL type, serialize option strings into JSON arrays.
  - Transactionally:
    1. Create `SubredditPost`.
    2. Increment `postCount` in `Subreddit`.
* **`GET /api/reddit/posts`**:
  - Accept query parameter `sort` (`hot`, `new`, `top`, `best`).
  - Accept query parameter `subredditId` (optional, to filter feed by subreddit).
  - Sort implementation details:
    - `new`: `orderBy: { createdAt: 'desc' }`.
    - `top`: `orderBy: { score: 'desc' }`.
    - `hot` / `best`: Fetch posts and calculate hotness score in memory:
      $$\text{hotScore} = \frac{\text{score}}{(\text{ageInHours} + 2)^{1.5}}$$
      Sort results based on calculated `hotScore` desc.
* **`GET /api/reddit/posts/[id]`**:
  - Retrieve post details, check current user's vote state in `RedditVote`.
  - Fetch associated `SubredditComment` records matching `postId`. Include author details. Highlight comments where `isAMAAnswer === true` and comment author is post author.

#### 3. Engagement Endpoints
* **`POST /api/reddit/posts/[id]/vote` & `/api/reddit/comments/[id]/vote`**:
  - Expect request body: `{ type: "UPVOTE" | "DOWNVOTE" }`.
  - Implement a transaction block (`prisma.$transaction`) that:
    1. Checks for an existing `RedditVote` record.
    2. Computes the score delta:
       - Upvote to Downvote: score delta = -2, karma delta = -2.
       - Downvote to Upvote: score delta = +2, karma delta = +2.
       - Clear Vote: score delta = -1 (if upvote cleared) or +1 (if downvote cleared), karma delta = same.
       - New Vote: score delta = +1 (upvote) or -1 (downvote), karma delta = same.
    3. Updates or creates `RedditVote` record.
    4. Updates target score (`upvotes`, `downvotes`, `score`).
    5. Updates target author's `redditKarma` by the karma delta.
* **`POST /api/reddit/posts/[id]/award`**:
  - Expect request body: `{ name, icon, price, receiverId }`.
  - Transaction block:
    1. Check sender's `channelPoints`. If `channelPoints < price`, return 400 (insufficient balance).
    2. Deduct `price` from sender's `channelPoints`.
    3. Add `price` (or a proportional bonus) to receiver's `redditKarma`.
    4. Create `RedditAward` record.
* **`POST /api/reddit/posts/[id]/crosspost`**:
  - Expect request body: `{ targetSubredditId }`.
  - Create a new `SubredditPost` in the target subreddit with a reference flag, and link them via `RedditCrosspost`.
* **`POST /api/reddit/posts/[id]/ama`**:
  - Endpoint to toggle `isAMA: true` on the post (requester must be the author or moderator).
  - Comments by the author inside this post can flag `isAMAAnswer: true`.

#### 4. Moderation Endpoints (`/api/reddit/mod`)
* **`POST /api/reddit/mod`**:
  - Expect body: `{ action, subredditId, targetUserId?, targetPostId?, targetCommentId?, reason? }`.
  - Verify that the requester is a `MODERATOR` or `ADMIN` in the specified `Subreddit`.
  - Handle actions:
    - `LOCK_POST`: Update `SubredditPost` setting `isLocked: true`.
    - `REMOVE_POST`: Update `SubredditPost` (either delete or set soft-delete status).
    - `REMOVE_COMMENT`: Update `SubredditComment` setting `isDeleted: true`.
    - `BAN_USER`: Update `SubredditMember` for the target user setting `isBanned: true`.
    - `MUTE_USER`: Update `SubredditMember` setting `isMuted: true`.
  - Create `RedditModAction` record to log the mod event.

---

## 5. Verification Method

To verify the correct execution and robustness of the schema changes and route logic:

### A. Schema Verification
1. Run Prisma push to migrate database structures:
   ```bash
   npx prisma db push
   ```
2. Re-generate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Verify that compilation passes with no schema errors by executing:
   ```bash
   npm run type-check
   ```

### B. API Route Integrity
1. Start the server:
   ```bash
   npm run dev
   ```
2. Execute automated E2E tests:
   ```bash
   node tests/e2e_runner.js
   ```
   Ensure the current test suite passes with zero regressions.
3. Validate database entries using Prisma Studio to check models:
   ```bash
   npx prisma studio
   ```
