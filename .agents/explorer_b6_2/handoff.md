# Handoff Report — Batch 6 Live Streaming & Video Platform

This handoff report summarizes the read-only investigation and proposal for implementing the Batch 6 Live Streaming & Video Platform in the Wakka Wakka repository.

---

## 1. Observation

The following file layouts, configurations, and models were observed:

- **`PROJECT.md`**: Lines 4-10:
  ```markdown
  Wakka Wakka is a Next.js 14 full-stack social media application using:

  - **Database**: SQLite (development) with Prisma ORM.
  - **Frontend**: Next.js App Router, Radix UI primitives, Tailwind CSS.
  - **State Management**: Zustand stores.
  - **Real-Time**: Socket.IO for interactive notifications and chat channels.
  ```
- **`prisma/schema.prisma`**: Lines 556-587 contain the `LiveStream` model:
  ```prisma
  model LiveStream {
    id           String   @id @default(cuid())
    hostId       String
    host         User     @relation("LiveStreamHost", fields: [hostId], references: [id], onDelete: Cascade)
    title        String
    ...
    isActive     Boolean  @default(false)
    isRecorded   Boolean  @default(false)
    recordingUrl String?
    giftTotal    Float    @default(0)
    category     String?
    ...
  }
  ```
- **`src/app/(main)/live/page.tsx`**: Lines 61-139 utilize mock data (`MOCK_LIVE_STREAMS`, `MOCK_USERS`) and intervals to simulate live comments and viewer counts.
- **`src/lib/currentUser.ts`**: Lines 13-19 demonstrate that users are authenticated by the `x-user-id` header or the `userId` query parameter:
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
- **`server.ts`**: Lines 93-104 establish Socket.IO handlers for stream chat and gift visual elements:
  ```typescript
  socket.on("join-live", (streamId: string) => {
    socket.join(`live:${streamId}`);
  });
  socket.on("live-comment", (data: { streamId: string; comment: unknown }) => {
    io.to(`live:${data.streamId}`).emit("live-comment", data.comment);
  });
  socket.on("live-gift", (data: { streamId: string; gift: unknown }) => {
    io.to(`live:${data.streamId}`).emit("live-gift", data.gift);
  });
  ```

---

## 2. Logic Chain

- **Step 1**: To satisfy the `SCOPE.md` requirement of adding predictions, prediction options, prediction bets, and clips models, we must define the database relationships in `prisma/schema.prisma`.
- **Step 2**: The existing `LiveStream` model already supports `isRecorded` (Boolean) and `recordingUrl` (String), which can naturally function as VOD assets once a stream ends. Therefore, no new VOD model is needed; rather, VOD features should be represented as ended, recorded `LiveStream` instances.
- **Step 3**: Tipping, gift transactions, and prediction bets require a balance mechanism. The `User` model currently lacks a numeric balance field. Adding `channelPoints Int @default(0)` solves this requirement.
- **Step 4**: To make streaming actions real-time, the frontend client makes REST calls to save state changes in the database, and then broadcasts these events via the established Socket.IO pipeline (configured in `server.ts`). Adding specific handlers for predictions and co-hosting registration to this list completes the required real-time architecture.
- **Step 5**: Because category browsing, VODs, and clips involve retrieving high volumes of records from a SQLite DB, adding database indexes on `category`, `isRecorded`, `isActive`, and `liveStreamId` is necessary to ensure optimal page load performance.

---

## 3. Caveats

- **Socket Server Environment**: The custom server in `server.ts` executes in a separate process from Next.js API routes. Next.js routes cannot directly trigger `io.to().emit()` unless we use an external messaging layer (like Redis) or make HTTP webhooks to the custom server. Alternatively, client-side emissions (where the client receives the REST response and subsequently emits the socket event) must be strictly relied upon, which matches the existing message/typing socket pattern in `server.ts`.
- **Database Engine**: Since SQLite is the active database provider, it does not support native enums or complex decimals. Enums (e.g., prediction status: ACTIVE, LOCKED, RESOLVED) must be validated at the application layer via Zod, and monetary gift totals must use the `Float` type.

---

## 4. Conclusion

We have created a comprehensive, production-ready implementation plan. We have laid out the detailed schema specifications, API routes layout, Zod schemas, socket events, and query optimization recommendations in `analysis.md`. The design is fully aligned with the constraints in `PROJECT.md` and fulfills the requirements in `SCOPE.md`.

---

## 5. Verification Method

- **TypeScript Compilation & Linting**: Run `npm run type-check` and `npm run lint` to ensure that adding new relations does not create type errors.
- **Prisma Schema Validation**: Verify that the schema edits compile successfully by running:
  ```bash
  npx prisma validate
  ```
- **Database Synchronization**: Apply the schema to the local SQLite database by running:
  ```bash
  npx prisma db push
  ```
- **File Integrity**: Inspect `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_b6_2\analysis.md` to review the proposed Zod schemas and route logic.
