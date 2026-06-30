# Challenger Batch 9 Handoff Report

## 1. Observation

Direct observations made within `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local`:

### Finding A: Negative-Price Award Exploit (Point Duplication / Arbitrary Minting)
- **Files**:
  - `src/app/api/reddit/posts/[id]/award/route.ts`
  - `src/app/api/reddit/comments/[id]/award/route.ts`
- **Lines (Posts Award)**:
  - Lines 21–23:
    ```typescript
    if (!name || price === undefined || !icon) {
      return NextResponse.json({ error: "Award name, price, and icon are required" }, { status: 400 });
    }
    ```
  - Lines 39–41:
    ```typescript
    if (sender.channelPoints < price) {
      return NextResponse.json({ error: "Insufficient channel points balance" }, { status: 400 });
    }
    ```
  - Lines 49–51:
    ```typescript
    channelPoints: {
      decrement: price,
    },
    ```
- **Lines (Comments Award)**:
  - Lines 21–23:
    ```typescript
    if (!name || price === undefined || !icon) {
      return NextResponse.json({ error: "Award name, price, and icon are required" }, { status: 400 });
    }
    ```
  - Lines 38–40:
    ```typescript
    if (sender.channelPoints < price) {
      return NextResponse.json({ error: "Insufficient channel points balance" }, { status: 400 });
    }
    ```
  - Lines 47–49:
    ```typescript
    channelPoints: {
      decrement: price,
    },
    ```

### Finding B: Moderator Action Log Deletion reference Nullification
- **File**: `src/app/api/reddit/mod/route.ts`
- **Lines**:
  - Lines 63–65 (Deleting post physically):
    ```typescript
    await tx.subredditPost.delete({
      where: { id: targetPostId },
    });
    ```
  - Line 128 (Mod action creation):
    ```typescript
    targetPostId: actionMapped === "REMOVE_POST" ? null : (targetPostId || null),
    ```
- **File**: `prisma/schema.prisma`
- **Lines**:
  - Lines 2120–2121:
    ```prisma
    targetPostId    String?
    targetPost      SubredditPost?    @relation(fields: [targetPostId], references: [id], onDelete: SetNull)
    ```

### Finding C: Threaded Comment Parent Post ID Cross-Contamination
- **File**: `src/app/api/reddit/posts/[id]/comments/route.ts`
- **Lines**:
  - Line 75: `const { content, parentId } = body;`
  - Lines 110–121:
    ```typescript
    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.subredditComment.create({
        data: {
          content: content.trim(),
          postId,
          parentId: parentId || null,
          ...
    ```
  - Lines 38–51:
    ```typescript
    comments.forEach((c) => {
      const mapped = map[c.id];
      if (c.parentId) {
        const parent = map[c.parentId];
        if (parent) {
          parent.replies.push(mapped);
        } else {
          // If parent doesn't exist (e.g. deleted), treat as root or discard
          roots.push(mapped);
        }
      } else {
        roots.push(mapped);
      }
    });
    ```

---

## 2. Logic Chain

1. **Negative-Price Award Exploit Logic**:
   - The validation checks only verify that `price` is not `undefined`. They do not check if `price <= 0` or if `price` is a negative integer.
   - If a client sends `price = -1000` via the request body:
     - The check `sender.channelPoints < price` (e.g. `500 < -1000`) will evaluate to `false`.
     - The transaction updates the sender's `channelPoints` using `decrement: price` (i.e., decrementing by `-1000`), which behaves mathematically as `channelPoints - (-1000) = channelPoints + 1000`.
     - Therefore, the sender receives an increment of `1000` points instead of a deduction.
     - The receiver receives `Math.max(1, Math.floor(price / 10))` karma, which evaluates to `1` karma.
     - A malicious user can exploit this to generate infinite channel points.

2. **Moderator Action Log Nullification Logic**:
   - In SQLite/Prisma, the foreign key constraint `targetPostId` on `RedditModAction` links directly to a `SubredditPost` record.
   - If the moderator selects to remove a post physically (`tx.subredditPost.delete`), the corresponding `SubredditPost` record is permanently deleted.
   - Any transaction trying to write a `RedditModAction` log containing that non-existent `targetPostId` would fail with a foreign key constraint violation.
   - To avoid database crashes, `/api/reddit/mod` deliberately sets `targetPostId: null` on `REMOVE_POST`.
   - Consequently, the system logs that a removal occurred, but loses all reference to the original post ID, rendering moderation audits of deleted posts ineffective.

3. **Cross-Contamination comment logic**:
   - When a child comment reply is posted via `/api/reddit/posts/[id]/comments`, the endpoint accepts a `parentId` from the request body.
   - It fails to verify if that `parentId` belongs to the same post (`postId`).
   - If a client passes a `parentId` of a comment in Post A to create a reply in Post B, the database creates the record with `postId: B` and `parentId: parentId_A`.
   - When fetching comments for Post B, the endpoint fetches comments where `postId: B`. The parent comment (from Post A) is not retrieved.
   - The tree builder fails to find the parent comment in the local dictionary map, falling back to rendering the child comment as a root comment for Post B.
   - This leads to database state corruption (parent-child relationship pointing across posts) and visual display inconsistencies.

---

## 3. Caveats

- We assumed that `channelPoints` should only be manipulated by positive-priced transactions.
- We did not run Next.js build or E2E tests, adhering to the instruction to avoid port conflicts.
- We did not investigate frontend rendering behaviors or styles; all review was performed on API controllers and Prisma schemas.

---

## 4. Conclusion (Adversarial Review Challenge Report)

### Challenge Summary
**Overall risk assessment**: HIGH

### Challenges

#### [Critical] Challenge 1: Arbitrary Minting via Negative-Price Awards
- **Assumption challenged**: That award prices are always positive and defined by the client or trusted system values.
- **Attack scenario**: Send `{ "name": "Gold Award", "price": -5000, "icon": "gold" }` to `/api/reddit/posts/[id]/award` or `/api/reddit/comments/[id]/award`.
- **Blast radius**: The sender receives a net gain of `5000` points. Arbitrary inflation and point duplication.
- **Mitigation**: Add a validation bound check:
  ```typescript
  if (price <= 0 || !Number.isInteger(price)) {
    return NextResponse.json({ error: "Price must be a positive integer" }, { status: 400 });
  }
  ```

#### [Medium] Challenge 2: Audit Trail Loss for Removed Posts
- **Assumption challenged**: That moderator actions are fully auditable through `RedditModAction` logs.
- **Attack scenario**: Moderator deletes a post via the mod action endpoint.
- **Blast radius**: The action is logged but `targetPostId` is nullified, making it impossible to know which post was removed.
- **Mitigation**: Change physical delete to soft-delete (`isDeleted: true`), or store a snapshot of the deleted post's ID and title as text/JSON inside a separate auditable column (e.g., `targetPostMetadata`) in the `RedditModAction` log.

#### [Low] Challenge 3: Cross-Post Comment Mismatch
- **Assumption challenged**: That comment parent-child hierarchies are strictly scoped to the same post.
- **Attack scenario**: Submit a comment reply specifying a `parentId` belonging to a comment from a different subreddit post.
- **Blast radius**: Creates orphaned replies that render as root comments on the target post but hold references to a different post's comment in the DB.
- **Mitigation**: Add a validation step in `/api/reddit/posts/[id]/comments` POST handler to verify the parent comment matches the current post ID:
  ```typescript
  if (parentId) {
    const parentComment = await tx.subredditComment.findUnique({ where: { id: parentId } });
    if (!parentComment || parentComment.postId !== postId) {
      return NextResponse.json({ error: "Invalid parent comment ID" }, { status: 400 });
    }
  }
  ```

---

## 5. Verification Method

To verify these findings manually:

1. **Verify Negative-Price Award Exploit**:
   - Inspect `src/app/api/reddit/posts/[id]/award/route.ts` and `src/app/api/reddit/comments/[id]/award/route.ts` and notice the absence of `price <= 0` validation checks.

2. **Verify Mod Action Nullification**:
   - Inspect `src/app/api/reddit/mod/route.ts` at line 128:
     ```typescript
     targetPostId: actionMapped === "REMOVE_POST" ? null : (targetPostId || null)
     ```
   - Notice that if `actionMapped` is `"REMOVE_POST"`, the post ID is systematically overwritten with `null`.

3. **Verify Cross-Post Comment Hierarchy**:
   - Inspect `src/app/api/reddit/posts/[id]/comments/route.ts` and notice that `parentId` from `body` is directly passed to `prisma.subredditComment.create` without checking `parentComment.postId === postId`.
