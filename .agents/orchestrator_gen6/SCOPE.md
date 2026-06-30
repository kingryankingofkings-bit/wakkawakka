# Scope: Batch 9 (Forum & Voting, Reddit-style)

## Architecture & Requirements
We are implementing a full Reddit-style forum and voting system containing:
1. **Prisma Schema updates**:
   - Add field to `User`: `redditKarma` (Int @default(0))
   - Add models:
     - `Subreddit`: name (unique), slug (unique), description, creatorId, rules, memberCount, postCount, customTheme (JSON), isNSFW, isSpoiler, createdAt, updatedAt
     - `SubredditMember`: subredditId, userId, role (MEMBER, MODERATOR, ADMIN), flair, joinedAt, isBanned, isMuted
     - `SubredditPost`: title, content, type (TEXT, POLL, LINK, MEDIA), mediaUrls, pollOptions (JSON), pollVotes (JSON), upvotes, downvotes, score, authorId, subredditId, isSpoiler, isNSFW, isLocked, isPinned, isAMA, karmaValue, createdAt, updatedAt
     - `SubredditComment`: content, authorId, postId, parentId, upvotes, downvotes, score, isDeleted, isAMAAnswer, createdAt, updatedAt
     - `RedditVote`: userId, targetId, type (UPVOTE, DOWNVOTE), targetType (POST, COMMENT), createdAt
     - `RedditAward`: name, icon, price, senderId, receiverId, targetId, targetType, createdAt
     - `RedditCrosspost`: originalPostId, targetSubredditId, crosspostedPostId, createdAt
     - `RedditModAction`: subredditId, moderatorId, action, targetUserId, targetPostId, targetCommentId, reason, createdAt
2. **API Routes**:
   - `/api/reddit/subreddits`: Create/List subreddits.
   - `/api/reddit/subreddits/[id]`: Retrieve/Update subreddit details (moderation rules, details).
   - `/api/reddit/posts`: List all posts (with sort: hot, new, top, best) or create new post (rich text, poll, media).
   - `/api/reddit/posts/[id]`: Retrieve/Edit post details, add comments.
   - `/api/reddit/posts/[id]/vote`: Cast upvote/downvote (updates post score and author's `redditKarma`).
   - `/api/reddit/posts/[id]/award`: Give a virtual award (consumes user coins/points, increases author's karma).
   - `/api/reddit/posts/[id]/crosspost`: Crosspost to another subreddit.
   - `/api/reddit/posts/[id]/ama`: Start AMA session, allowing highlighted author responses.
   - `/api/reddit/comments/[id]/vote`: Upvote/downvote comments.
   - `/api/reddit/mod`: Moderation endpoints (lock posts, remove posts/comments, ban/mute users).
3. **Frontend Changes**:
   - Create route `/reddit` showing global subreddit feeds, trending sidebar, custom feed filters (Hot, New, Top), and subreddit directories.
   - Create route `/reddit/r/[name]` showing specific subreddit details, customized styling, rule bars, moderators, and its feed.
   - Create route `/reddit/r/[name]/comments/[id]` containing post details with nested, collapsible comment replies, AMA answer highlights.
   - Implement post composer modal supporting Markdown text formatting, Poll Creation, image/video upload attachments, post flairs, NSFW, and Spoiler blur tags.
4. **Interface Contracts**:
   - Enforce database persistence using SQLite. No mocks.
   - Secure premium routes by verifying user status and session tokens.
   - Sync upvotes, comments, and moderation actions in real-time using Socket.IO.

## Execution Rules
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- Verify everything via builds, lints, and E2E test runs.
