# Batch 6: Live Streaming & Video Platform — Analysis Report

## 1. Executive Summary

This report analyzes the requirements for Batch 6 (Live Streaming & Video Platform) in the Wakka Wakka application and proposes concrete designs for schema additions, API routes, Zod validation schemas, real-time socket events, and database query optimizations.

Wakka Wakka is built on Next.js 14, using SQLite (via Prisma ORM) for persistence, and Socket.IO for real-time features. To transition the current simulated streaming pages into a database-persisted streaming ecosystem, we need to introduce:

- **Schema Updates**: Prediction, PredictionOption, PredictionBet, and Clip models, alongside adding a `channelPoints` balance to the `User` model.
- **Backend API Routes**: Highly-optimized REST endpoints for stream scheduling, active stream updates, co-hosting registration, interactive chat, bits/gifts tipping, Twitch-style prediction polls, and live clips generation.
- **Real-Time Integration**: Expanding `server.ts` Socket.IO rooms with events mapping to prediction phases, stream states, and tipping events.
- **Retrieval Efficiency**: Appropriate indexing and query structuring to handle large volumes of categories, VODs, and clips efficiently in SQLite.

---

## 2. Database Schema & Migration Proposals

### 2.1 Prisma Schema Additions

To be added to `prisma/schema.prisma`.

```prisma
// =============================================================================
// Live Streaming & Video Additions (Batch 6)
// =============================================================================

model User {
  // Existing fields ...
  channelPoints        Int             @default(0)
  predictionBets       PredictionBet[] @relation("UserBets")
  clipsCreated         Clip[]          @relation("ClipCreator")
  // Existing relations ...
}

model LiveStream {
  // Existing fields ...
  predictions          Prediction[]    @relation("StreamPredictions")
  clips                Clip[]          @relation("StreamClips")

  // Indexes for query efficiency
  @@index([hostId])
  @@index([isActive])
  @@index([category])
  @@index([isRecorded])
  @@index([createdAt])
}

model Prediction {
  id              String             @id @default(cuid())
  liveStreamId    String
  liveStream      LiveStream         @relation("StreamPredictions", fields: [liveStreamId], references: [id], onDelete: Cascade)
  title           String
  status          String             @default("ACTIVE") // ACTIVE | LOCKED | RESOLVED | CANCELLED
  winningOptionId String?            // Points to PredictionOption id when RESOLVED
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  options         PredictionOption[] @relation("PredictionToOptions")

  @@index([liveStreamId])
  @@index([status])
}

model PredictionOption {
  id           String          @id @default(cuid())
  predictionId String
  prediction   Prediction      @relation("PredictionToOptions", fields: [predictionId], references: [id], onDelete: Cascade)
  title        String
  color        String?         // Visual differentiation (e.g., "blue", "pink")
  totalPoints  Int             @default(0) // Cache total points bet on this option for quick read

  bets         PredictionBet[] @relation("OptionBets")

  @@index([predictionId])
}

model PredictionBet {
  id                 String           @id @default(cuid())
  predictionOptionId String
  predictionOption   PredictionOption @relation("OptionBets", fields: [predictionOptionId], references: [id], onDelete: Cascade)
  userId             String
  user               User             @relation("UserBets", fields: [userId], references: [id], onDelete: Cascade)
  points             Int              // Amount of channel points placed
  createdAt          DateTime         @default(now())

  @@index([predictionOptionId])
  @@index([userId])
}

model Clip {
  id           String     @id @default(cuid())
  creatorId    String
  creator      User       @relation("ClipCreator", fields: [creatorId], references: [id], onDelete: Cascade)
  liveStreamId String
  liveStream   LiveStream @relation("StreamClips", fields: [liveStreamId], references: [id], onDelete: Cascade)
  title        String
  videoUrl     String
  duration     Float      // Duration of the clip in seconds (max 60s)
  viewCount    Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([liveStreamId])
  @@index([creatorId])
  @@index([createdAt])
}
```

### 2.2 DB Migration Steps

Because the development database is SQLite:

1. Run `npx prisma db push` to synchronize changes directly in local development environments.
2. Run `npx prisma generate` to rebuild the TypeScript client types.
3. For deployment environments, run `npx prisma migrate dev --name init_batch_6` to create SQL migration files.

---

## 3. Code Layout & Route Design

### 3.1 Directory Structure

The following route handlers should be established in `src/app/api`:

```
src/
└── app/
    └── api/
        └── live/
            ├── streams/
            │   ├── route.ts             # POST: Create/Schedule, GET: List active/VODs
            │   └── [id]/
            │       ├── route.ts         # GET: Info, PATCH: Update metadata / end stream
            │       ├── cohost/
            │       │   └── route.ts     # POST: Register co-host
            │       ├── chat/
            │       │   └── route.ts     # GET: History, POST: Add comment & emit socket event
            │       ├── gifts/
            │       │   └── route.ts     # POST: Send gift & deduct points / emit socket event
            │       ├── predictions/
            │       │   ├── route.ts     # GET: Retrieve stream polls, POST: Create prediction (host only)
            │       │   └── [predictionId]/
            │       │       ├── bet/
            │       │       │   └── route.ts # POST: Place bet with channel points
            │       │       └── resolve/
            │       │           └── route.ts # POST: Resolve prediction & pay out pool (host only)
            │       └── clips/
            │           └── route.ts     # GET: List stream clips, POST: Create clip
```

---

## 4. Backend API Endpoint Specifications

### 4.1 Zod Validation Schemas

```typescript
import { z } from "zod";

export const streamCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  thumbnailUrl: z
    .string()
    .url("Invalid thumbnail URL")
    .optional()
    .or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  scheduledAt: z
    .string()
    .datetime({ message: "Invalid ISO datetime string" })
    .optional()
    .or(z.null()),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).default("PUBLIC"),
});

export const streamUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  thumbnailUrl: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isRecorded: z.boolean().optional(),
  recordingUrl: z.string().url().optional(),
});

export const chatCommentSchema = z.object({
  message: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(280, "Comment is too long"),
  customEmotes: z.array(z.string()).optional(), // custom emotes list
});

export const giftSendSchema = z.object({
  giftType: z.string().min(1),
  giftName: z.string().min(1),
  amount: z.number().positive(),
  quantity: z.number().int().positive().default(1),
});

export const predictionCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title is too long"),
  options: z
    .array(
      z.object({
        title: z
          .string()
          .min(1, "Option title is required")
          .max(50, "Option title is too long"),
        color: z.string().optional(),
      }),
    )
    .min(2, "At least 2 options are required")
    .max(5, "At most 5 options are allowed"),
});

export const betPlaceSchema = z.object({
  predictionOptionId: z.string().cuid(),
  points: z.number().int().positive("Bet points must be positive"),
});

export const predictionResolveSchema = z.object({
  status: z.enum(["RESOLVED", "CANCELLED"]),
  winningOptionId: z.string().cuid().optional(), // Must be present if status is RESOLVED
});

export const clipCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  videoUrl: z.string().url("Invalid video URL"),
  duration: z
    .number()
    .positive("Duration must be positive")
    .max(60, "Clips cannot exceed 60 seconds"),
});
```

---

### 4.2 Route Implementations & Logic Flow

#### A. Streams Listing and Creation (`/api/live/streams`)

- **GET**: Lists active streams, VODs, or schedules.
  - **Auth**: None required (public visibility).
  - **Inputs**: Query Params: `category` (string), `status` ('active' | 'scheduled' | 'recorded'), `limit`, `page`.
  - **Optimized Database Query**:
    ```typescript
    const whereClause: any = {};
    if (status === "active") {
      whereClause.isActive = true;
    } else if (status === "scheduled") {
      whereClause.scheduledAt = { not: null, gt: new Date() };
      whereClause.isActive = false;
    } else if (status === "recorded") {
      whereClause.isRecorded = true;
      whereClause.isActive = false;
    }
    if (category) {
      whereClause.category = category;
    }
    const streams = await prisma.liveStream.findMany({
      where: whereClause,
      include: { host: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    ```
- **POST**: Create or schedule a new stream.
  - **Auth**: Requires user session (`getRequestUserId`).
  - **Validation**: `streamCreateSchema`.
  - **Database Action**: Creates `LiveStream` with a new `streamKey` (cuid) and sets `playbackUrl = rtmp://live.wakkawakka.com/app/{streamKey}`. If `scheduledAt` is provided, `isActive = false`, otherwise `isActive = true`.

#### B. Stream Details and Ending (`/api/live/streams/[id]`)

- **GET**: Retrieve single stream info including host and co-hosts.
- **PATCH**: Update stream info or transition states (e.g. End Stream).
  - **Auth**: Verify that the acting user `getRequestUserId(req)` is equal to the stream's `hostId`.
  - **Logic for Ending Stream**:
    - Set `isActive = false`, `endedAt = new Date()`.
    - Set `isRecorded = true` and generate a `recordingUrl` to convert it to a VOD.
    - Save to SQLite and trigger a socket notification to all room members (`live-stream-ended`).

#### C. Co-host Registration (`/api/live/streams/[id]/cohost`)

- **POST**: Allows adding a co-host.
  - **Auth**: Host authorization.
  - **Logic**: Create a `LiveStreamCoHost` entry linked to the user and stream. Trigger socket event `live-cohost-joined`.

#### D. Stream Interactive Chat (`/api/live/streams/[id]/chat`)

- **GET**: Fetch message logs for the stream.
- **POST**: Send chat comment.
  - **Auth**: Authenticated user.
  - **Validation**: `chatCommentSchema`.
  - **Database Action**: Saves comment details. In SQLite database, comments can be stored in the generic `LiveStreamGift` or a chat logs collection. Wait, because chat comments do not require historical DB persistence for long-term storage (unless VOD replay is implemented), they can be optionally saved or emitted directly. If persisting, we write to a comment log.
  - **Real-Time Notification**: Emit socket event `live-comment` to room `live:${streamId}` with the sender user details.

#### E. bits/Gifts Tipping (`/api/live/streams/[id]/gifts`)

- **POST**: Sends interactive bits/gifts.
  - **Auth**: Authenticated user.
  - **Validation**: `giftSendSchema`.
  - **Logic**:
    1. Verify sender user has sufficient `channelPoints` if paying with points (or process payment if bits are purchased).
    2. Subtract `amount * quantity` from sender's `channelPoints` balance using a transaction:
       ```typescript
       await prisma.$transaction([
         prisma.user.update({
           where: { id: senderId },
           data: { channelPoints: { decrement: amount * quantity } },
         }),
         prisma.liveStream.update({
           where: { id: streamId },
           data: { giftTotal: { increment: amount * quantity } },
         }),
         prisma.liveStreamGift.create({
           data: {
             liveStreamId: streamId,
             senderId,
             giftType,
             giftName,
             amount,
             quantity,
           },
         }),
       ]);
       ```
    3. Trigger Socket.IO event `live-gift` to the stream room `live:${streamId}` to broadcast a visual alert on the stream overlay.

#### F. Predictions Creation and Betting (`/api/live/streams/[id]/predictions`)

- **POST**: Start a prediction poll (Host Only).
  - **Auth**: Host checks.
  - **Validation**: `predictionCreateSchema`.
  - **Logic**: Create a `Prediction` and associated `PredictionOption` rows in a single transaction. Broadcast `live-prediction-created`.
- **POST** to `/api/live/streams/[id]/predictions/[predictionId]/bet`: Bet channel points on a specific option.
  - **Auth**: Authenticated user.
  - **Validation**: `betPlaceSchema`.
  - **Logic**:
    1. Verify prediction status is `ACTIVE` (not locked/resolved).
    2. Verify user has enough `channelPoints`.
    3. Inside a transaction:
       - Decrement user's `channelPoints`.
       - Create `PredictionBet` row.
       - Increment `totalPoints` on the target `PredictionOption`.
    4. Emit socket event `live-prediction-bet` to update odds/bet totals on the UI.

#### G. Resolving Predictions (`/api/live/streams/[id]/predictions/[predictionId]/resolve`)

- **POST**: Resolves prediction and payouts (Host Only).
  - **Auth**: Host checks.
  - **Validation**: `predictionResolveSchema`.
  - **Payout Mathematical Logic**:
    - If status is `CANCELLED`:
      - Query all bets for the prediction option.
      - Refund the exact bet amount to each user's `channelPoints`.
    - If status is `RESOLVED` and `winningOptionId` is provided:
      1. Query all options for the prediction. Compute `totalPool = Sum(option.totalPoints)`.
      2. Identify the winning option and its `winningPool = option.totalPoints`.
      3. Query all bets for the winning option: `PredictionBet.findMany({ where: { predictionOptionId: winningOptionId } })`.
      4. For each winning bet:
         - Calculate user payout: `payout = Math.floor((bet.points / winningPool) * totalPool)`.
         - Update user `channelPoints` by adding the payout.
      5. Mark the prediction `status = RESOLVED` and `winningOptionId`.
    - Perform all database updates inside a single transactional block `prisma.$transaction` to guarantee consistency.
    - Broadcast `live-prediction-resolved` to the stream room.

#### H. Creating Clips (`/api/live/streams/[id]/clips`)

- **POST**: Save a clip from a live stream or VOD.
  - **Auth**: Authenticated user.
  - **Validation**: `clipCreateSchema`.
  - **Database Action**: Saves the clip to the database (`Clip.create`). Returns metadata.

---

## 5. Real-Time Socket Events Design

We map backend state updates to client views using these Socket.IO events. These will hook into the server-side rooms initialized via `join-live` in `server.ts`:

| Event Name                 | Source     | Room               | Payload Description                                                      |
| -------------------------- | ---------- | ------------------ | ------------------------------------------------------------------------ |
| `live-comment`             | Client/API | `live:${streamId}` | `{ id, user: { displayName, avatar }, message, type: 'COMMENT' }`        |
| `live-gift`                | API        | `live:${streamId}` | `{ id, user: { displayName }, giftName, emoji, amount, quantity }`       |
| `live-prediction-created`  | API        | `live:${streamId}` | `{ id, title, options: [{ id, title, color }] }`                         |
| `live-prediction-bet`      | API        | `live:${streamId}` | `{ predictionId, optionId, totalPoints, totalBets }`                     |
| `live-prediction-resolved` | API        | `live:${streamId}` | `{ predictionId, status, winningOptionId, payoutsDistributed: boolean }` |
| `live-stream-ended`        | API        | `live:${streamId}` | `{ streamId, recordingUrl }`                                             |
| `live-cohost-joined`       | API        | `live:${streamId}` | `{ streamId, user: { displayName, avatar } }`                            |

---

## 6. Data Retrieval & Query Efficiency Analysis

### 6.1 Critical Indexes

SQLite lacks clustered indexing, meaning secondary indexes are vital to maintain low query latency:

1. `LiveStream` indexes:
   - `isActive`: Speed up listing of all ongoing streams on the home page.
   - `category`: Accelerates category filter queries.
   - `isRecorded`: Speeds up loading the VOD archives page.
2. `Clip` indexes:
   - `liveStreamId`: Speeds up retrieval of clips associated with a specific stream or VOD.
   - `createdAt`: Orders clips by recency (e.g. "trending clips" page).
3. `PredictionBet` indexes:
   - `predictionOptionId`: Optimizes payout calculation when summing bets.

### 6.2 N+1 Query Prevention

To retrieve streams, predictions, and clips efficiently without triggering N+1 query loops:

- Use Prisma's `include` to fetch related records in a single query rather than making consecutive lookups.
- Example for VOD category browsing:
  ```typescript
  const categoryVodListing = await prisma.liveStream.findMany({
    where: {
      category: categoryName,
      isRecorded: true,
      isActive: false,
    },
    include: {
      host: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
      clips: {
        take: 3, // retrieve preview clips to display in browsing row
        orderBy: { viewCount: "desc" },
      },
    },
    orderBy: { endedAt: "desc" },
    take: 20,
  });
  ```

This fetches the stream metadata, its host details, and its top clips in a single query.
