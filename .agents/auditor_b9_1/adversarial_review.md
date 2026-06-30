# Adversarial Review Report

## Challenge Summary

**Overall risk assessment**: LOW

## Challenges

### [Low] Challenge 1: Vote manipulation under high concurrency
- Assumption challenged: Simultaneous voting requests from the same user are serial and won't cause race conditions in score/karma calculation.
- Attack scenario: A user sends multiple vote requests concurrently. If not guarded by unique DB keys or transaction blocks, it could lead to multiple score increments/decrements or mismatched karma levels.
- Blast radius: Post score and user karma integrity.
- Mitigation: The implementation uses unique constraint indexes (`userId_targetId_targetType` on `RedditVote` table) and wraps the vote modifications inside a Prisma transaction, preventing double-vote entries and restoring correct score increments.

### [Low] Challenge 2: Locked posts receiving comments
- Assumption challenged: API routes block commenting on locked posts.
- Attack scenario: A user attempts to post a comment to a locked post by sending a direct API request to `/api/reddit/posts/[id]/comments` bypassing the client UI.
- Blast radius: Moderation circumvention, comment spam on archived threads.
- Mitigation: The server API explicitly checks `if (post.isLocked) { return NextResponse.json({ error: "Post is locked" }, { status: 400 }); }`, correctly blocking comments at the database gate.

## Stress Test Results

- Negative Tip Amount → Rejected with Error → Correctly rejected with status 400 → PASS
- Tip exceeding $10,000 limit → Rejected with Error → Correctly rejected with status 400 → PASS
- Negative Channel Points Bet → Rejected with Error → Correctly rejected with status 400 → PASS
- Float/Decimal Channel Points Bet → Rejected with Error → Correctly rejected with status 400 → PASS
- Sequential Double-Betting → Rejected with Error → Correctly rejected with status 400 → PASS
- Concurrent Double-Betting → Single Bet Created, duplicate rejected → Only 1 bet in DB, duplicate rejected → PASS
- Negative Live Stream Gift Amount → Rejected with Error → Correctly rejected with status 400 → PASS

## Unchallenged Areas

- Audio streaming quality & latency — out of scope for the Reddit-style forum audit.
- Real-time Socket.IO transport layer handshake limits — not part of the functional integrity verification.
