# Implementation Plan: Batch 9 Forum & Voting (Reddit-style)

This plan synthesizes the exploration reports from Explorer 1, 2, and 3.

## 1. Database Schema Updates
We will append the following models to `prisma/schema.prisma` and update `User`:
- **User**: Add `redditKarma Int @default(0)` and relationships to the new models.
- **Subreddit**: `id`, `name` (unique), `slug` (unique), `description`, `creatorId`, `rules` (JSON string array), `memberCount`, `postCount`, `customTheme` (JSON theme string), `isNSFW`, `isSpoiler`, `createdAt`, `updatedAt`.
- **SubredditMember**: `id`, `subredditId`, `userId`, `role` ("MEMBER" | "MODERATOR" | "ADMIN"), `flair`, `joinedAt`, `isBanned`, `isMuted` (unique on `[subredditId, userId]`).
- **SubredditPost**: `id`, `title`, `content?`, `type` ("TEXT" | "POLL" | "LINK" | "MEDIA"), `mediaUrls` (JSON string array), `pollOptions` (JSON array of strings), `pollVotes` (JSON mapping string), `upvotes`, `downvotes`, `score`, `authorId`, `subredditId`, `isSpoiler`, `isNSFW`, `isLocked`, `isPinned`, `isAMA`, `karmaValue`, `createdAt`, `updatedAt`.
- **SubredditComment**: `id`, `content`, `authorId`, `postId`, `parentId?`, `upvotes`, `downvotes`, `score`, `isDeleted`, `isAMAAnswer`, `createdAt`, `updatedAt`.
- **RedditVote**: `id`, `userId`, `targetId` (post/comment ID), `type` ("UPVOTE" | "DOWNVOTE"), `targetType` ("POST" | "COMMENT") (unique on `[userId, targetId, targetType]`).
- **RedditAward**: `id`, `name`, `icon`, `price`, `senderId`, `receiverId`, `targetId`, `targetType`, `createdAt`.
- **RedditCrosspost**: `id`, `originalPostId`, `targetSubredditId`, `crosspostedPostId` (unique on `[originalPostId, targetSubredditId]`).
- **RedditModAction**: `id`, `subredditId`, `moderatorId`, `action` ("LOCK_POST" | "REMOVE_POST" | "REMOVE_COMMENT" | "BAN_USER" | "MUTE_USER"), `targetUserId?`, `targetPostId?`, `targetCommentId?`, `reason?`, `createdAt`.

Run:
```bash
npx prisma db push
npx prisma generate
```

## 2. Zustand State Store & Hooks
- Create `src/store/redditStore.ts` using Zustand following the structure in the State/Socket Explorer report.
- Create `src/hooks/useRedditSocket.ts` to manage joining rooms (`reddit-post:${postId}`, `reddit-subreddit:${subredditId}`) and syncing live votes, comments, and mod actions.

## 3. API Endpoints (`src/app/api/reddit/`)
- `/api/reddit/subreddits`: `POST` to create subreddit, `GET` to list.
- `/api/reddit/subreddits/[id]`: `GET` to retrieve, `PATCH` to update rules, description, and themes (requires Mod/Admin permission).
- `/api/reddit/subreddits/[id]/join`: `POST` to join/leave.
- `/api/reddit/posts`: `POST` to publish, `GET` to query feed. Handles in-memory algorithmic sorting for `hot` and `best` feeds based on vote score decay:
  $$\text{hotScore} = \frac{\text{score}}{(\text{ageInHours} + 2)^{1.5}}$$
- `/api/reddit/posts/[id]`: `GET` to retrieve post details and comments, checking active vote state.
- `/api/reddit/posts/[id]/comments`: `POST` to add root comment or reply. Auto-flags `isAMAAnswer: true` if post is in AMA mode and author replies.
- `/api/reddit/posts/[id]/vote` & `/api/reddit/comments/[id]/vote`: `POST` to register upvote/downvote. Use transactions to update vote records, post/comment scores, and author karma atomically.
- `/api/reddit/posts/[id]/award`: `POST` to buy an award using `channelPoints` and update receiver's `redditKarma` atomically.
- `/api/reddit/posts/[id]/crosspost`: `POST` to duplicate post into another subreddit.
- `/api/reddit/posts/[id]/ama`: `POST` to toggle AMA session.
- `/api/reddit/mod`: `POST` to perform moderator actions (`LOCK_POST`, `REMOVE_POST`, `REMOVE_COMMENT`, `BAN_USER`, `MUTE_USER`) checking member roles.

## 4. Socket.IO Events (`server.ts` updates)
Add handlers for:
- `join-reddit-post` and `leave-reddit-post`
- `join-reddit-subreddit` and `leave-reddit-subreddit`
- Broadcasting `reddit-new-vote`, `reddit-new-comment`, `reddit-new-award`, and `reddit-mod-action-alert`.

## 5. Frontend Pages
- Layout Adjustability in `src/app/(main)/layout.tsx`: Support full page layout without constraint limits when paths start with `/reddit`.
- `/reddit`: Global feed with Hot/New/Top selectors, Subreddit recommendation panel, User karma display.
- `/reddit/r/[name]`: Detail page with custom styling, rules, posts, and Mod Tools button.
- `/reddit/r/[name]/comments/[id]`: Nested collapsible comment tree, AMA highlights.
- Modal: `RedditPostComposer` supporting Rich Text markdown, Poll details, attachments, flairs, NSFW, and Spoiler blur settings.

## 6. E2E Tests
Append the Tier 4 test case from the UI & Test Explorer report to `tests/e2e_runner.js`.

## 7. Verification Steps
1. Run `npx prisma db push && npx prisma generate`
2. Run `npm run type-check`
3. Run `npm run lint`
4. Run `node tests/e2e_runner.js`
5. Run `npm run build`
