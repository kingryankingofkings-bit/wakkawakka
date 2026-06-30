# Handoff Report — Review of Batch 9: Forum & Voting (Reddit-style)

## 1. Observation
- **Active Workspace**: `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local`
- **Reviewed Files**:
  - `prisma/schema.prisma` (Lines 1959–2129)
  - `server.ts` (Lines 279–315)
  - `src/app/api/reddit/comments/[id]/award/route.ts`
  - `src/app/api/reddit/comments/[id]/vote/route.ts`
  - `src/app/api/reddit/mod/route.ts`
  - `src/app/api/reddit/posts/[id]/ama/route.ts`
  - `src/app/api/reddit/posts/[id]/award/route.ts`
  - `src/app/api/reddit/posts/[id]/comments/route.ts`
  - `src/app/api/reddit/posts/[id]/crosspost/route.ts`
  - `src/app/api/reddit/posts/[id]/route.ts`
  - `src/app/api/reddit/posts/[id]/vote/route.ts`
  - `src/app/api/reddit/posts/route.ts`
  - `src/app/api/reddit/subreddits/[id]/join/route.ts`
  - `src/app/api/reddit/subreddits/[id]/route.ts`
  - `src/app/api/reddit/subreddits/route.ts`

- **Execution Results**:
  - `npm run type-check` ran successfully:
    ```
    > wakkawakka@0.1.0 type-check
    > tsc --noEmit
    ```
  - `npm run lint` ran successfully with 0 errors, though some warnings were present (e.g. `<img>` element warnings and hook dependency warning in `ChatWindow.tsx`).

---

## 2. Logic Chain
1. **SQLite Compatibility Check**:
   - Native enums are avoided in `prisma/schema.prisma`. Columns like `type` in `SubredditPost` (line 2007) and `action` in `RedditModAction` (line 2117) are defined as `String` with defaults, representing enums at the application level.
   - JSON columns (e.g., `mediaUrls`, `pollOptions`, `pollVotes`) are modeled as `String` or `String?` with comments detailing them as SQLite JSON strings (lines 2008–2010). They are parsed using `JSON.parse` and serialized using `JSON.stringify` in the API endpoints (e.g. `/api/reddit/posts/route.ts`), which is safe and compatible.
   - Therefore, SQLite compatibility constraints are successfully maintained.

2. **Correctness & Completeness Check**:
   - In `/api/reddit/mod/route.ts` (lines 62–65), when a moderator performs the `REMOVE_POST` action, `tx.subredditPost.delete` is executed.
   - In `/api/reddit/posts/route.ts` (POST, lines 177–184) and `/api/reddit/posts/[id]/crosspost/route.ts` (POST, lines 108–115), when posts are created, `subreddit.postCount` is incremented.
   - However, when a post is deleted by `REMOVE_POST` in `/api/reddit/mod/route.ts`, the corresponding subreddit's `postCount` is NOT decremented. This will result in an incorrect post count on the subreddit.

3. **Robustness (Vote Mismatch) Check**:
   - In `/api/reddit/comments/[id]/vote/route.ts` and `/api/reddit/posts/[id]/vote/route.ts`, the type check `type !== undefined && type !== "UPVOTE" && type !== "DOWNVOTE" && type !== null` permits `type` to be `undefined` (omitted from request body).
   - If `type` is `undefined`, the delta logic falls into the `else` block (clearing a vote). However, when updating the DB:
     - `type === null` is false.
     - The `else` block executes `await tx.redditVote.update({ where: { id: existingVote.id }, data: { type } })` where `type` is `undefined`.
     - In Prisma, passing `undefined` to a field update behaves as a no-op (the field remains unchanged).
     - This means the `RedditVote` record is NOT deleted, but the score on the post/comment is decremented/incremented as if the vote was deleted, causing a mismatch.

---

## 3. Caveats
- The frontend client application using these APIs was not fully traced, under the assumption that it conforms to sending `{ type: "UPVOTE" | "DOWNVOTE" | null }` explicitly.
- Performance scaling of the in-memory sorting algorithm (`hot` / `best` in `/api/reddit/posts/route.ts`) was not tested under high volumes of posts (O(N log N) sorting in Node process).

---

## 4. Conclusion & Verdict
- **Verdict**: **REQUEST_CHANGES**
- **Rationale**:
  - The `postCount` counter is never decremented when posts are deleted via mod actions (`REMOVE_POST`).
  - There is a subtle bug in the voting endpoints that could mismatch score metrics and vote records if `type` is omitted/undefined.

---

## 5. Verification Method
1. Run `npm run type-check` to confirm compilation.
2. Run `npm run lint` to check for code styles.
3. Test `REMOVE_POST` via the moderation API and verify if the subreddit `postCount` decreases.
4. Test the voting API with an omitted `type` body attribute and check if the `RedditVote` table is in sync with the `score` field of the post/comment.

---

# QUALITY & ADVERSARIAL REVIEW REPORTS

## Review Summary
- **Verdict**: REQUEST_CHANGES
- **Quality Score**: Good, but contains logical sync/correctness issues.
- **Integrity Check**: PASS. No dummy facades, hardcoded test logic, or cheating patterns detected.

## Findings

### [Major] Finding 1: Subreddit `postCount` out of sync on Post Deletion
- **What**: The `postCount` counter of the `Subreddit` model is not decremented when a post is deleted.
- **Where**: `src/app/api/reddit/mod/route.ts` (lines 62–65)
- **Why**: When a moderator deletes a post (`actionMapped === "REMOVE_POST"`), it deletes the post from the database but does not update the subreddit's `postCount` attribute, leaving it incorrect.
- **Suggestion**: Add an update block to decrement `postCount` inside the `REMOVE_POST` transaction:
  ```ts
  await tx.subreddit.update({
    where: { id: post.subredditId },
    data: { postCount: { decrement: 1 } },
  });
  ```

### [Minor] Finding 2: Vote Record / Score Desynchronization when `type` is undefined
- **What**: Sending an omitted `type` field in the POST request body causes the post/comment score to update without deleting or updating the actual vote record in the database.
- **Where**:
  - `src/app/api/reddit/comments/[id]/vote/route.ts` (lines 21, 93)
  - `src/app/api/reddit/posts/[id]/vote/route.ts` (lines 21, 95)
- **Why**: If `type` is `undefined`, it is not validated as bad (passes line 21 check). The score delta treats it as `null` (clear vote), but the database update passes `type` (`undefined`) to Prisma, which leaves the database record unchanged.
- **Suggestion**: Change the validation on line 21 to reject `undefined`:
  ```ts
  if (type === undefined || (type !== "UPVOTE" && type !== "DOWNVOTE" && type !== null)) {
    return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
  }
  ```

---

## Verified Claims
- **Claim**: The code has SQLite compatibility.
  - *Verified via*: Inspecting `prisma/schema.prisma` and checking how lists and enums are modeled as strings. (PASS)
- **Claim**: Real-time Socket.IO handlers exist.
  - *Verified via*: Inspecting `server.ts` for socket.on events for Reddit comments, votes, awards, and mod actions. (PASS)
- **Claim**: Code compiles without errors.
  - *Verified via*: Running `npm run type-check` and `npm run lint`. (PASS)

---

## Coverage Gaps
- **Voting authorization for banned/muted users**: Banned/muted users can still vote or spend channel points to award, as `/vote` and `/award` endpoints do not check their membership state.
  - *Risk level*: Low-Medium
  - *Recommendation*: Consider checking if the voter/awarder is banned or muted in the subreddit.

---

# CHALLENGE REPORT (ADVERSARIAL CRITIC)

- **Overall risk assessment**: MEDIUM

## Challenges

### [Medium] Challenge 1: Voting or Awarding by Banned/Muted Users
- **Assumption challenged**: Banned or muted users are prevented from interacting with a subreddit.
- **Attack scenario**: A user is banned from `r/sports` for bad behavior. They cannot post or comment, but they can still upvote their friends' posts or downvote others, and spend their points to give awards.
- **Blast radius**: Allows malicious or restricted users to influence scores and karma.
- **Mitigation**: Add a check in `/vote` and `/award` endpoints to verify that the user does not have a `SubredditMember` record with `isBanned: true` or `isMuted: true`.

### [Low] Challenge 2: In-Memory Sorting performance degradation
- **Assumption challenged**: The sorting algorithm is fast and handles any list size.
- **Attack scenario**: Under heavy load, `/api/reddit/posts` retrieves thousands of posts. The O(N log N) in-memory sorting on the JS event loop can block processing.
- **Blast radius**: High API latency or Event Loop lag under high load.
- **Mitigation**: Move sorting to the database layer (if possible) or implement pagination (`take`, `skip`) so that only a small page of posts is sorted in memory.
