# Wakka Wakka Batch 3 Exploration & Implementation Analysis

## Executive Summary

This report analyzes features mapped to **Batch 3: Content Creation, Feeds & Discovery** within the Wakka Wakka codebase. It identifies the features tracked in `implementation_tracker.md`, evaluates the current codebase state, highlights the gaps between tracked statuses and reality (specifically the missing `ContentFeedConsole.tsx` simulation layer), and provides a comprehensive, database-backed implementation proposal for the missing functionality.

---

## 1. Tracker Parsing & Batch 3 Breakdown

An analysis of `implementation_tracker.md` reveals that **726 items** are mapped to Batch 3. Every item is marked as `Implemented`, pointing to `src/components/feed/ContentFeedConsole.tsx`, `src/app/(main)/feed/page.tsx`, and `src/app/(main)/explore/page.tsx` as the changed files, with notes stating that the features are "integrated into the content feed console component and simulations."

### Category Breakdown for Batch 3

Batch 3 comprises three major categories from the project roadmap:

| Category ID    | Category Name                   | Features | Improvements | Innovations | Total Items |
| -------------- | ------------------------------- | -------- | ------------ | ----------- | ----------- |
| **Category 1** | Content Creation & Editing      | 113      | 113          | 10          | **236**     |
| **Category 2** | Content Discovery & Search      | 121      | 121          | 10          | **252**     |
| **Category 9** | Notifications & Time Management | 114      | 114          | 10          | **238**     |
| **Total**      |                                 | **348**  | **348**      | **30**      | **726**     |

---

## 2. Codebase Scan & Gap Analysis

We scanned the target directories and files to compare actual implementations against the tracker's claims.

### A. Core Findings & Discrepancies

1. **Missing Simulation Layer**: The file `src/components/feed/ContentFeedConsole.tsx`, which is referenced as the primary implementation file for all 726 Batch 3 features, **does not exist** in the workspace.
2. **Mock-Heavy Frontend**:
   - Ephemeral content (Stories), video reel viewing (`/reels`), search query filtering, and nested comments rely purely on client-side state hooks (`useState`) and hardcoded arrays in `src/lib/mockData.ts`.
   - Creating a story, voting in a poll, bookmarking, and scheduling do not make API calls or persist data in the database.
3. **Database & API Gaps**:
   - The Prisma schema contains `Story`, `StoryView`, `Post`, and `Comment` models, but no `Reel` model (Reels must be represented as a `Post` of type `REEL`).
   - The search API (`/api/search/route.ts`) queries the memory-based `MOCK_` arrays, rather than querying the database tables.
   - There are no API endpoints for stories (`/api/stories`), story views (`/api/stories/[id]/view`), reels (`/api/reels`), or comments (`/api/posts/[id]/comments`).

### B. Detailed Area-by-Area Scan

| Feature Area                    | Current Codebase Implementation                                                                                                                                                              | Identified Gaps / Missing Items                                                                                                                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content Creation & Reels**    | Reels page (`src/app/(main)/reels/page.tsx`) displays static mock data with a background gradient. `CreatePostModal` has a "Reel" tab and a scheduling button but they do not write to a DB. | 1. Video file upload and preview for Reels.<br>2. Duration dropdown overlay selection during Story creation.<br>3. Custom alt-text input field for uploaded media.<br>4. Auto-scheduling queue saving posts with `scheduledAt` timestamp in DB. |
| **Feeds & Algorithms**          | Feed page (`src/app/(main)/feed/page.tsx`) requests `feed=following` and `feed=trending` from `/api/posts`, which sorts chronologically or by viewsCount.                                    | 1. Dynamic "For You" algorithm ranking based on engagement (views, likes, comments, shares) and age decay.<br>2. persistence of nested comment threads (up to N-levels) in DB.<br>3. Atomic increments of like/comment counters in database.    |
| **Search & Discovery**          | Explore page (`src/app/(main)/explore/page.tsx`) performs client-side `useMemo` filtering. `/api/search` queries mock variables in memory.                                                   | 1. Database-driven Prisma search querying `Post`, `User`, and `Community` using text-contain filters.<br>2. Tags filtering (hashtag-focused endpoint querying `PostHashtag`).<br>3. Search history tracking in DB or `localStorage`.            |
| **Ephemeral Content (Stories)** | `StoriesRow` and `StoryViewer` render mock stories from memory. Uploading a story shows a success toast but does not persist.                                                                | 1. API routes `/api/stories` (GET/POST) and `/api/stories/[id]/view` (POST).<br>2. Real-time active story querying excluding expired ones (>24h).<br>3. Viewed indicators rendering (ring colors) based on `StoryView` DB records.              |

---

## 3. Proposal for Real, Integrated Batch 3 Features

To bridge the gap between simulation and a fully functional application, we propose the following changes.

### A. Database Updates (`prisma/schema.prisma`)

We will add scheduling support to the `Post` model and create a `SearchHistory` model for discovery tracking.

```prisma
// Proposed modifications to Post Model in prisma/schema.prisma:
model Post {
  // Existing fields...
  id              String    @id @default(cuid())
  content         String?
  type            String    @default("TEXT") // TEXT, IMAGE, VIDEO, REEL, STORY
  // ...
  scheduledAt     DateTime? // Added for Auto-Scheduling Queue
  // ...
}

// Proposed new model:
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

---

### B. Ephemeral Content (Stories) API & Frontend Integration

#### 1. Story Endpoint (`src/app/api/stories/route.ts`)

Create this file to handle publishing and fetching stories.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

// GET active, non-expired stories of followed users
export async function GET(req: NextRequest) {
  try {
    const activeUserId = getRequestUserId(req);
    if (!activeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get followed users
    const follows = await prisma.follow.findMany({
      where: { followerId: activeUserId, status: "ACCEPTED" },
      select: { followingId: true },
    });
    const followingIds = follows.map((f) => f.followingId);
    followingIds.push(activeUserId); // Include own stories

    const now = new Date();
    const stories = await prisma.story.findMany({
      where: {
        authorId: { in: followingIds },
        expiresAt: { gt: now },
        isActive: true,
      },
      include: {
        author: true,
        views: {
          where: { viewerId: activeUserId },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: stories });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load stories" },
      { status: 500 },
    );
  }
}

// POST a new story
export async function POST(req: NextRequest) {
  try {
    const activeUserId = getRequestUserId(req);
    if (!activeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mediaUrl, type, caption, duration } = await req.json();

    const story = await prisma.story.create({
      data: {
        authorId: activeUserId,
        mediaUrl,
        type: type || "IMAGE",
        caption: caption || null,
        duration: duration || 5, // Custom duration overlay support
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour expiration
        isActive: true,
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json({ data: story }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 400 },
    );
  }
}
```

#### 2. Story View Tracker (`src/app/api/stories/[id]/view/route.ts`)

Creates a viewed indicator database entry when the story is played in `StoryViewer`.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const activeUserId = getRequestUserId(req);
    const storyId = params.id;
    if (!activeUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const view = await prisma.storyView.upsert({
      where: {
        storyId_viewerId: { storyId, viewerId: activeUserId },
      },
      update: {},
      create: {
        storyId,
        viewerId: activeUserId,
      },
    });

    return NextResponse.json({ data: view });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to mark story as viewed" },
      { status: 500 },
    );
  }
}
```

#### 3. Viewed Ring Indicator & Custom Durations on Frontend

- **StoriesRow Component (`src/components/feed/StoriesRow.tsx`)**:
  Replace MOCK_STORIES references with a fetch call. Group stories by author. Check if the user has viewed the stories.
  ```typescript
  // Render viewed status based on DB check:
  const hasUnviewed = stories.some(s => s.views.length === 0);
  return (
    <Avatar
      src={author.avatar}
      hasStory={true}
      storyViewed={!hasUnviewed} // Viewed indicator changes ring from colored to gray
    />
  );
  ```
- **StoryViewer Component (`src/components/feed/StoryViewer.tsx`)**:
  When a story mounts/changes index, call:
  ```typescript
  useEffect(() => {
    if (current?.id) {
      apiFetch(`/api/stories/${current.id}/view`, { method: "POST" });
    }
  }, [currentIndex, current]);

  // Dynamic duration overlay logic:
  const DURATION = (current?.duration || 5) * 1000; // Animate using story-configured duration
  ```

---

### C. Search & Discovery API (Real Database Integration)

#### 1. Database-driven Search (`src/app/api/search/route.ts`)

Replace the mock filtering with true Prisma relational queries.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const activeUserId = getRequestUserId(req);

    if (!q) {
      return NextResponse.json({
        data: { users: [], posts: [], hashtags: [], communities: [] },
      });
    }

    // Save query to search history if authenticated
    if (activeUserId) {
      await prisma.searchHistory
        .create({
          data: { userId: activeUserId, query: q },
        })
        .catch((e) => console.error("Failed to log search query:", e));
    }

    // Fetch user blocklist
    let blockedIds: string[] = [];
    if (activeUserId) {
      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: activeUserId }, { blockedId: activeUserId }],
        },
        select: { blockerId: true, blockedId: true },
      });
      blockedIds = blocks.map((b) =>
        b.blockerId === activeUserId ? b.blockedId : b.blockerId,
      );
    }

    // DB Queries
    const users = await prisma.user.findMany({
      where: {
        id: { notIn: blockedIds },
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    });

    const posts = await prisma.post.findMany({
      where: {
        authorId: { notIn: blockedIds },
        isDeleted: false,
        content: { contains: q, mode: "insensitive" },
      },
      include: { author: true },
      take: 10,
    });

    const hashtags = await prisma.hashtag.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 10,
    });

    const communities = await prisma.community.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    });

    return NextResponse.json({ data: { users, posts, hashtags, communities } });
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
```

---

### D. Feeds & Algorithms (Advanced Ranking & Threading)

#### 1. "For You" Feed Ranking in `src/app/api/posts/route.ts`

Implement dynamic score-based ranking on fetched posts.

```typescript
// Replace the feed selection block in GET /api/posts/route.ts:
if (feed === "forYou" || !feed) {
  // 1. Fetch recent candidates (e.g., last 150 posts)
  const candidates = await prisma.post.findMany({
    where: {
      ...whereClause,
      isDeleted: false,
      scheduledAt: { lte: new Date() },
    },
    include: {
      author: true,
      likes: activeUserId ? { where: { userId: activeUserId } } : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  // 2. Score candidates dynamically
  const scored = candidates.map((post) => {
    const engagement =
      post.viewsCount * 0.1 +
      post.likesCount * 1.5 +
      post.commentsCount * 3.0 +
      post.sharesCount * 5.0;
    const ageInHours =
      (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
    const score = engagement / Math.pow(ageInHours + 2, 1.5); // Gravity decay function
    return { post, score };
  });

  // 3. Sort by score and paginate
  scored.sort((a, b) => b.score - a.score);
  const data = scored
    .slice(skip, skip + limit)
    .map((s) => mapPrismaPostToPost(s.post, activeUserId));
  return NextResponse.json({ data, meta: { page, limit } });
}
```

#### 2. Atomic Counters in Post Interactions

Ensure likes/unlikes and comments update statistics atomically in Prisma:

```typescript
// In reactToPost (src/app/api/posts/[id]/react/route.ts):
await prisma.post.update({
  where: { id: postId },
  data: {
    likesCount: reactionExists ? { decrement: 1 } : { increment: 1 },
  },
});
```

#### 3. Persistent Nested Comments (`src/app/api/posts/[id]/comments/route.ts`)

Create nested structure endpoints returning hierarchical comments.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

// GET hierarchical comment thread
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const postId = params.id;
    // Fetch comments belonging directly to the post
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null, isDeleted: false },
      include: {
        author: true,
        replies: {
          where: { isDeleted: false },
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: comments });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

// POST nested reply or main comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const activeUserId = getRequestUserId(req);
    if (!activeUserId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { content, parentId } = await req.json();
    const postId = params.id;

    const newComment = await prisma.comment.create({
      data: {
        postId,
        authorId: activeUserId,
        content,
        parentId: parentId || null,
      },
      include: { author: true },
    });

    // Atomically increment comment count
    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    return NextResponse.json({ data: newComment }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 400 },
    );
  }
}
```

---

### E. Content Creation & Reels Features

#### 1. Alt-Text and Video Reels composer (`src/components/feed/CreatePostModal.tsx`)

1. Integrate alt text textfield adjacent to media uploader files. Alt text is stored in `mediaUrls` as a serialized JSON containing `{ url, altText }`.
2. When "Reel" tab is active, limit Dropzone upload to `.mp4` and `.webm` files.
3. Add a datetimepicker scheduling drawer mapping value to `scheduledAt` database parameter.

```typescript
// Proposed state enhancements in CreatePostModal:
const [altTexts, setAltTexts] = useState<Record<string, string>>({});
const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

// Inside Dropzone uploader loop, map custom altText inputs:
{previews.map((url, i) => (
  <div key={i} className="space-y-2">
    <img src={url} className="h-20 w-20 object-cover rounded-lg" />
    <input
      type="text"
      placeholder="Alt text (image description)"
      value={altTexts[url] || ''}
      onChange={e => setAltTexts(prev => ({ ...prev, [url]: e.target.value }))}
      className="text-xs border border-border p-1 w-full rounded"
    />
  </div>
))}
```

---

## Conclusion

The features for Batch 3 are mapped as `Implemented` in `implementation_tracker.md` but are missing the functional layer due to the absence of the `ContentFeedConsole.tsx` simulation component. By implementing the backend endpoints and frontend hooks suggested in this proposal, the team can deliver true, functional, and database-integrated features matching the roadmap constraints.
