# Handoff Report: Batch 9 Forum & Voting (Reddit-style) Exploration

## 1. Observation

During the exploration of the Wakka Wakka codebase, the following files, line numbers, and architectural patterns were observed:

- **Database Schema (`prisma/schema.prisma`):**
  - Line 13: `provider = "sqlite"` indicates SQLite is the active database provider.
  - Lines 42-193: The `User` model currently lacks a `redditKarma` field.
  - No Reddit-specific models (`Subreddit`, `SubredditMember`, `SubredditPost`, `SubredditComment`, `RedditVote`, `RedditAward`, `RedditCrosspost`, `RedditModAction`) exist in the database schema.

- **E2E Test Runner (`tests/e2e_runner.js`):**
  - Line 36: `function runTest(tier, name, fn)` registers test cases.
  - Lines 71-125: Tier 1 verifies feature coverage against `implementation_tracker.md`.
  - Lines 127-462: Tier 2 contains boundary validations (Settings, Search, Billing).
  - Lines 464-617: Tier 3 validates cross-feature combinations (e.g., Switching active personas and settings updates).
  - Lines 620-2220: Tier 4 executes real-world integration flows (e.g., Live Streaming in M6 at lines 831-1146, Servers in M7 at lines 1152-1400, and Jobs in M8 at lines 1807-2218).
  - Tier 4 tests spawn the Next.js development server dynamically on a designated port (e.g. `port = 4081` at line 1812) using `spawn('node', [tsxPath, 'server.ts'], { env })` and make actual HTTP requests using a client-side fetch, asserting response statuses and checking Prisma client persistence.
  - Seeded users are fetched at lines 839-847 using `prisma.user.findUnique` for `wakkadev`, `alicedev`, and `bobdev`.

- **Main Navigation & Layout (`src/app/(main)/layout.tsx`):**
  - Lines 18-53: The application utilizes a standard desktop `<Sidebar />`, right `<RightPanel />`, and mobile `<MobileNav />`.
  - Lines 31-40: The main container has `max-w-2xl mx-auto px-0 sm:px-4` for standard routes, and `max-w-none px-0` for `/servers`.
  - Custom paths can override this layout logic by matching the URL pathname.

- **Feed & Post Components (`src/components/feed/`):**
  - `PostCard.tsx` (lines 1-150): Standard client component displaying post metrics (likes, comments, views), attachments, and verification badges.
  - `CreatePostModal.tsx` (lines 69-150): Custom modal built on `@/components/ui/Modal` with file dropping (`useDropzone`) and basic poll option inputs (capped at 5).
  - `CommentsSection.tsx` (lines 24-135): Renders comments and single-level replies (e.g. `replies: Comment[]`). It does not support arbitrary depth recursive nested trees out of the box.

- **Client Fetch Wrapper (`src/lib/apiClient.ts`):**
  - Lines 11-22: `apiFetch` automatically appends the current user ID as an `x-user-id` header using `useAuthStore.getState().user` or `CURRENT_USER`. This header is checked at the API layer via `getRequestUserId` from `src/lib/currentUser.ts`.

- **Real-Time WebSocket Server (`server.ts`):**
  - Lines 42-291: Socket.io initializes room events (e.g., `join-user`, `join-conversation`, `join-server`, `join-voice`). No event handlers are present for Reddit posts, upvoting, comments sync, or mod actions.

---

## 2. Logic Chain

Based on these observations, the implementation strategy is formulated through the following chain of reasoning:

1. **Database Schema Integration:**
   - Since SQLite is the database, we must extend `prisma/schema.prisma` with `redditKarma Int @default(0)` on the `User` model, alongside the detailed community and post structures required in `SCOPE.md`.
   - SQLite does not support native enums, so we must model fields like `type` or `role` as standard strings and validate them at the API layer (matching the project's existing convention described in schema lines 19-22).
   
2. **Layout Adaptability for `/reddit`:**
   - A global Reddit feed has a complex layout (central posts column + right sidebar for recommendations and karma).
   - In `src/app/(main)/layout.tsx`, we must expand the `isServerWorkspace` condition to include `isRedditWorkspace = pathname.startsWith("/reddit")`, ensuring `max-w-none px-0` is used so that the page can render its own sidebars side-by-side with the feed on desktop sizes.

3. **Arbitrary Comment Nesting:**
   - Reddit discussions rely on deep threaded reply trees.
   - We must design a recursive `RedditCommentItem` component that receives a comment and renders its list of children replies recursively. To prevent infinite indentations, we can cap visual indentation left-margins (e.g., `pl-4` or `border-l border-border pl-3`) or restrict nesting visually beyond a depth of 6, while maintaining database parent relationships.

4. **AMA Mode Implementation:**
   - During AMA mode, the host answers are highlighted.
   - The API endpoint `/api/reddit/posts/[id]/comments` must check if `isAMA` is active on the parent post. If so, comments authored by the post's `authorId` that reply to other comments will have their `isAMAAnswer` flag marked as `true` in the database.
   - The frontend will check `comment.isAMAAnswer` and apply a distinct styled border and background (e.g. `bg-primary/5 dark:bg-primary/10 border-l-2 border-primary`) to highlight host answers.

5. **Test Implementation Parity:**
   - To match M6-M8 tests in `tests/e2e_runner.js`, the Batch 9 tests must be written as a Tier 4 test case that spins up the server, fires sequential HTTP client requests with headers (using `x-user-id`), verifies response payloads, and does direct Prisma database assertions.
   - To avoid database contamination, the E2E test must create a sandbox subreddit (e.g. slug: `e2e-reddit-test`), perform all actions (join, post, vote, comment, award, mod), verify the state, and delete the created records in a `finally` block.

---

## 3. Caveats

- **SQLite JSON Constraints:**
  - `customTheme`, `pollOptions`, and `pollVotes` are stored as JSON strings in SQLite. The application layer must parse and validate them using `JSON.parse` / `JSON.stringify`. No native JSON querying is available.
- **Media Uploads:**
  - Standard file uploading is simulated in tests by passing mock URLs (`https://example.com/image.jpg`). Real uploads should hook into the project's file ingestion flow.
- **Karma Synchronization:**
  - Voting must be transactional. If a user casts a vote, we must atomically update both the `SubredditPost` / `SubredditComment` score AND the author's `redditKarma` using a Prisma transaction (`$transaction`). If a vote is modified or deleted, the difference must be correctly calculated and synced.

---

## 4. Conclusion & Implementation Strategy

### A. Recommended Database Models (to append to `prisma/schema.prisma`)

```prisma
// Add to User model:
// redditKarma          Int                 @default(0)
// createdSubreddits    Subreddit[]         @relation("SubredditCreator")
// subredditMemberships SubredditMember[]
// subredditPosts       SubredditPost[]
// subredditComments    SubredditComment[]
// redditVotes          RedditVote[]
// sentAwards           RedditAward[]       @relation("AwardSender")
// receivedAwards       RedditAward[]       @relation("AwardReceiver")
// redditModActions     RedditModAction[]   @relation("ModeratorActions")

model Subreddit {
  id           String            @id @default(cuid())
  name         String            @unique
  slug         String            @unique
  description  String
  creatorId    String
  creator      User              @relation("SubredditCreator", fields: [creatorId], references: [id], onDelete: Cascade)
  rules        String            @default("[]") // JSON array of rules
  memberCount  Int               @default(0)
  postCount    Int               @default(0)
  customTheme  String            @default("{}") // JSON theme styling
  isNSFW       Boolean           @default(false)
  isSpoiler    Boolean           @default(false)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  members      SubredditMember[]
  posts        SubredditPost[]
  crossposts   RedditCrosspost[]
  modActions   RedditModAction[]
}

model SubredditMember {
  id          String    @id @default(cuid())
  subredditId String
  subreddit   Subreddit @relation(fields: [subredditId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        String    @default("MEMBER") // MEMBER, MODERATOR, ADMIN
  flair       String?
  joinedAt    DateTime  @default(now())
  isBanned    Boolean   @default(false)
  isMuted     Boolean   @default(false)

  @@unique([subredditId, userId])
}

model SubredditPost {
  id          String            @id @default(cuid())
  title       String
  content     String?
  type        String            @default("TEXT") // TEXT, POLL, LINK, MEDIA
  mediaUrls   String            @default("[]") // JSON string list
  pollOptions String            @default("[]") // JSON list of string options
  pollVotes   String            @default("{}") // JSON map: { optionIndex: voteCount }
  upvotes     Int               @default(0)
  downvotes   Int               @default(0)
  score       Int               @default(0)
  authorId    String
  author      User              @relation(fields: [authorId], references: [id], onDelete: Cascade)
  subredditId String
  subreddit   Subreddit         @relation(fields: [subredditId], references: [id], onDelete: Cascade)
  isSpoiler   Boolean           @default(false)
  isNSFW      Boolean           @default(false)
  isLocked    Boolean           @default(false)
  isPinned    Boolean           @default(false)
  isAMA       Boolean           @default(false)
  karmaValue  Int               @default(0)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  comments    SubredditComment[]
  votes       RedditVote[]
  awards      RedditAward[]
  crossposts  RedditCrosspost[] @relation("OriginalPost")
}

model SubredditComment {
  id          String             @id @default(cuid())
  content     String
  authorId    String
  author      User               @relation(fields: [authorId], references: [id], onDelete: Cascade)
  postId      String
  post        SubredditPost      @relation(fields: [postId], references: [id], onDelete: Cascade)
  parentId    String?
  parent      SubredditComment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     SubredditComment[] @relation("CommentReplies")
  upvotes     Int                @default(0)
  downvotes   Int                @default(0)
  score       Int                @default(0)
  isDeleted   Boolean            @default(false)
  isAMAAnswer Boolean            @default(false)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  votes       RedditVote[]
  awards      RedditAward[]
}

model RedditVote {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  targetId   String
  type       String   // UPVOTE, DOWNVOTE
  targetType String   // POST, COMMENT
  createdAt  DateTime @default(now())

  @@unique([userId, targetId])
}

model RedditAward {
  id         String   @id @default(cuid())
  name       String   // Silver, Gold, Platinum
  icon       String
  price      Int
  senderId   String
  sender     User     @relation("AwardSender", fields: [senderId], references: [id], onDelete: Cascade)
  receiverId String
  receiver   User     @relation("AwardReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
  targetId   String
  targetType String   // POST, COMMENT
  createdAt  DateTime @default(now())
}

model RedditCrosspost {
  id                  String        @id @default(cuid())
  originalPostId      String
  originalPost        SubredditPost @relation("OriginalPost", fields: [originalPostId], references: [id], onDelete: Cascade)
  targetSubredditId   String
  targetSubreddit     Subreddit     @relation(fields: [targetSubredditId], references: [id], onDelete: Cascade)
  crosspostedPostId   String        @unique
  createdAt           DateTime      @default(now())
}

model RedditModAction {
  id              String    @id @default(cuid())
  subredditId     String
  subreddit       Subreddit @relation(fields: [subredditId], references: [id], onDelete: Cascade)
  moderatorId     String
  moderator       User      @relation("ModeratorActions", fields: [moderatorId], references: [id], onDelete: Cascade)
  action          String    // LOCK, PIN, REMOVE_POST, REMOVE_COMMENT, BAN, MUTE
  targetUserId    String?
  targetPostId    String?
  targetCommentId String?
  reason          String?
  createdAt       DateTime  @default(now())
}
```

### B. Frontend File Layout & Pages

Create new routes under `src/app/(main)/reddit` to handle the pages:

1. **`/reddit` (Global Subreddit Board):**
   - File: `src/app/(main)/reddit/page.tsx`
   - Content: Feed sorted by filter tabs (Hot, New, Top) loaded via `/api/reddit/posts?sort=hot`.
   - Sidebars:
     - Subreddit recommendations: Lists top 5 trending subreddits with Join/Leave buttons.
     - User karma widget: Displays the signed-in user's `redditKarma` score and a "Create Community" button.
     - Search input: Performs filter parameters on posts by keyword.

2. **`/reddit/r/[name]` (Subreddit Sub-community View):**
   - File: `src/app/(main)/reddit/r/[name]/page.tsx`
   - Content: Detail header displaying custom theme colors/banners, subreddit name, member count, and rules checklist.
   - Mod Panel button: visible only if the user has role `MODERATOR` or `ADMIN` in `SubredditMember` for this subreddit. Opens actions modal.

3. **`/reddit/r/[name]/comments/[id]` (Post Detail & Nested Replies):**
   - File: `src/app/(main)/reddit/r/[name]/comments/[id]/page.tsx`
   - Content: Full post content. Handles poll votes if type is `POLL`. Offers "Give Award" and "Crosspost" triggers.
   - Collapsible Comments Tree: Loads list of `SubredditComment` records. We build a recursive React component `RedditCommentNode` rendering reply input blocks under each reply node.
   - AMA Highlights: Comments with `isAMAAnswer = true` render with `border-l-4 border-amber-500 bg-amber-500/5` to clearly highlight the host's responses.

4. **Reddit Post Composer Modal (`RedditPostComposer.tsx`):**
   - File: `src/components/reddit/RedditPostComposer.tsx`
   - UI Controls:
     - Subreddit dropdown selector (defaults to current if inside subpage).
     - Title input, post type tabs: Text (Markdown toolbar), Poll (input fields with dynamic `add options` buttons up to 5), Media (drag-drop zones).
     - Flairs selection dropdown, NSFW & Spoiler toggles.

### C. Socket.io Event Additions (in `server.ts`)

Add the following websocket listener nodes in `server.ts` to sync interactions:

```typescript
// Join reddit post comment thread room
socket.on("join-reddit-post", (postId: string) => {
  socket.join(`reddit-post:${postId}`);
});

// Broadcast upvote/downvote scores
socket.on("reddit-vote-cast", (data: { targetId: string; score: number; upvotes: number; downvotes: number }) => {
  io.emit("reddit-score-update", data); // Global emit for list score updates
});

// Broadcast new threaded comment
socket.on("reddit-comment-added", (data: { postId: string; comment: any }) => {
  socket.to(`reddit-post:${data.postId}`).emit("new-reddit-comment", data.comment);
});

// Broadcast moderator lock/pin changes
socket.on("reddit-mod-action-taken", (data: { postId: string; isLocked?: boolean; isPinned?: boolean; isDeleted?: boolean }) => {
  io.to(`reddit-post:${data.postId}`).emit("reddit-post-updated", data);
});
```

---

## 5. Verification Method

### A. E2E Test Code Proposal
Append the following test case under a new section at the end of the `Tier 4` tests block in `tests/e2e_runner.js`:

```javascript
// ============================================================================
// BATCH 9: FORUM & VOTING (REDDIT-STYLE) E2E TESTS
// ============================================================================

runTest('tier4', 'Reddit Platform Workflow: Create Subreddit -> Join -> Post Text/Poll -> Upvote/Karma Sync -> Nested Comments -> Award -> AMA Highlights -> Mod Actions', async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const { spawn } = require('child_process');
  const path = require('path');
  const port = 4085;
  const baseUrl = `http://127.0.0.1:${port}`;
  let serverProcess = null;

  try {
    const modUser = await prisma.user.findUnique({ where: { username: 'wakkadev' } });
    const authorUser = await prisma.user.findUnique({ where: { username: 'alicedev' } });
    const voterUser = await prisma.user.findUnique({ where: { username: 'bobdev' } });
    assert(modUser && authorUser && voterUser, 'Seeded users wakkadev, alicedev, and bobdev must exist');

    console.log(`    Spawning server on port ${port}...`);
    const tsxPath = path.resolve(__dirname, "../node_modules/tsx/dist/cli.cjs");
    const env = {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "development",
    };
    serverProcess = spawn('node', [tsxPath, 'server.ts'], { env });

    await new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          const res = await fetch(`${baseUrl}/api/posts`);
          if (res.status === 200 || res.status === 401) {
            clearInterval(checkInterval);
            resolve();
          }
        } catch (e) {}
      }, 500);
    });

    // 1. Create a Subreddit
    const subredditRes = await fetch(`${baseUrl}/api/reddit/subreddits`, {
      method: 'POST',
      headers: { 'x-user-id': modUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Testing Community',
        slug: 'e2e-testing',
        description: 'A sandbox community for automated test suites',
        rules: JSON.stringify(['Follow sandbox guidelines', 'No real spam'])
      })
    });
    assertEq(subredditRes.status, 200, 'Should create subreddit successfully');
    const subData = await subredditRes.json();
    const subredditId = subData.data.id;
    assert(subredditId, 'Subreddit must return a valid ID');

    // 2. Join Subreddit (alicedev joins)
    const joinRes = await fetch(`${baseUrl}/api/reddit/subreddits/${subredditId}/join`, {
      method: 'POST',
      headers: { 'x-user-id': authorUser.id }
    });
    assertEq(joinRes.status, 200, 'User should join subreddit successfully');

    // 3. Create a SubredditPost (TEXT/AMA post)
    const postRes = await fetch(`${baseUrl}/api/reddit/posts`, {
      method: 'POST',
      headers: { 'x-user-id': authorUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subredditId: subredditId,
        title: 'I am a Senior E2E Engineer, AMA!',
        content: 'Ask me anything about Node.js test runs and SQLite setups.',
        type: 'TEXT',
        isAMA: true
      })
    });
    assertEq(postRes.status, 200, 'Should publish post successfully');
    const postData = await postRes.json();
    const postId = postData.data.id;
    assert(postId, 'Post must return a valid ID');

    // 4. Upvote & Karma sync (voterUser upvotes authorUser post)
    const voteRes = await fetch(`${baseUrl}/api/reddit/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'x-user-id': voterUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'UPVOTE' })
    });
    assertEq(voteRes.status, 200, 'Should cast vote successfully');

    // Verify post score and author karma increment
    const dbPost = await prisma.subredditPost.findUnique({ where: { id: postId } });
    assertEq(dbPost.score, 1, 'Post score must increment to 1');
    const dbAuthor = await prisma.user.findUnique({ where: { id: authorUser.id } });
    assert(dbAuthor.redditKarma > 0, 'Author karma should increase after receiving an upvote');

    // 5. Nested threaded comment replies
    // Root comment by bobdev
    const rootCommentRes = await fetch(`${baseUrl}/api/reddit/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'x-user-id': voterUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'What is your favorite test suite library?' })
    });
    assertEq(rootCommentRes.status, 200, 'Should submit root comment');
    const rootComment = (await rootCommentRes.json()).data;

    // Sub-reply by AMA host alicedev (should automatically flag as isAMAAnswer)
    const replyCommentRes = await fetch(`${baseUrl}/api/reddit/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'x-user-id': authorUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'I really love running custom lightweight E2E scripts.', parentId: rootComment.id })
    });
    assertEq(replyCommentRes.status, 200, 'Should submit reply comment');
    const replyComment = (await replyCommentRes.json()).data;
    assertEq(replyComment.isAMAAnswer, true, 'Host response in AMA thread must set isAMAAnswer to true');

    // 6. Give Award (bobdev gives Gold award to alicedev post)
    const awardRes = await fetch(`${baseUrl}/api/reddit/posts/${postId}/award`, {
      method: 'POST',
      headers: { 'x-user-id': voterUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Gold', price: 100, icon: '🏆' })
    });
    assertEq(awardRes.status, 200, 'Should give award successfully');
    
    // Verify award record and extra karma sync
    const awardsCount = await prisma.redditAward.count({ where: { targetId: postId } });
    assertEq(awardsCount, 1, 'Award count in DB should be 1');

    // 7. Mod Actions (wakkadev locks the post)
    const modRes = await fetch(`${baseUrl}/api/reddit/mod`, {
      method: 'POST',
      headers: { 'x-user-id': modUser.id, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subredditId: subredditId,
        postId: postId,
        action: 'LOCK',
        reason: 'AMA timeframe has elapsed'
      })
    });
    assertEq(modRes.status, 200, 'Moderator should execute lock action successfully');

    const updatedPost = await prisma.subredditPost.findUnique({ where: { id: postId } });
    assertEq(updatedPost.isLocked, true, 'Post must set isLocked flag to true');

    // Verify Mod action is logged in database
    const loggedAction = await prisma.redditModAction.findFirst({
      where: { subredditId, targetPostId: postId }
    });
    assert(loggedAction, 'Moderator action log record must exist');
    assertEq(loggedAction.action, 'LOCK');

    // Cleanup E2E records
    await prisma.redditModAction.deleteMany({ where: { subredditId } });
    await prisma.redditAward.deleteMany({ where: { targetId: postId } });
    await prisma.subredditComment.deleteMany({ where: { postId } });
    await prisma.subredditPost.delete({ where: { id: postId } });
    await prisma.subredditMember.deleteMany({ where: { subredditId } });
    await prisma.subreddit.delete({ where: { id: subredditId } });

  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGKILL');
    }
    await prisma.$disconnect();
  }
});
```

### B. Verification Commands
1. Run database setup:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
2. Execute the test runner:
   ```bash
   node tests/e2e_runner.js
   ```
3. Inspect standard terminal logs to ensure the registered `Batch 9 Forum & Voting` E2E test runs successfully and terminates with `✓ [TIER4] Reddit Platform Workflow...` and no errors.
