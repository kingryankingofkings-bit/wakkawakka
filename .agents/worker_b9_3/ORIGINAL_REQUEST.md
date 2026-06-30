## 2026-06-30T19:36:17Z
You are worker_b9_3. Your task is to fix critical logic flaws in the Batch 9 (Reddit-style) API endpoints in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local.
Your working directory is: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b9_3

Please implement the following fixes:
1. In `src/app/api/reddit/posts/[id]/award/route.ts`:
   - Validate the `price` field in the request body. If `price <= 0` or if `price` is not a positive integer (e.g. check if `!Number.isInteger(price)`), return a 400 error status.
2. In `src/app/api/reddit/comments/[id]/award/route.ts`:
   - Validate the `price` field. If `price <= 0` or if `price` is not a positive integer, return a 400 error status.
3. In `src/app/api/reddit/posts/[id]/comments/route.ts`:
   - In the POST handler, if `parentId` is provided in the request body, verify that the parent comment exists and that its `postId` matches the current `postId`. If not, reject the request with a 400 error status ("Invalid parent comment ID").

After implementing:
1. Run `npm run type-check` to verify no compilation errors.
2. Run `npm run lint` to verify code style passes.
3. Run `npm run build` to verify Next.js production build compilation.
4. Run `node tests/e2e_runner.js` to verify all integration/E2E tests pass.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Document all changes made and test outputs in handoff.md in your working directory, and send a status update message to the parent orchestrator (conversation ID: 5152cc68-a190-4c02-a3db-e86cc4efc787) when complete.

## 2026-06-30T19:38:03Z
In addition to the negative award price check and comment parent validation fixes, please also implement these fixes for frontend syncing and navigation:

1. **In `src/store/redditStore.ts`**:
   - Add `socket: any | null` to the `RedditState` interface.
   - Add `setSocket: (socket: any) => void` to the `RedditActions` interface, and implement it to store the socket in state: `setSocket: (socket) => set({ socket })`.
   - Update these actions to look up `get().socket` and emit Socket.IO events after a successful API response:
     - `votePost`: Emit `"reddit-new-vote"` with `{ targetId: postId, targetType: "POST", score, upvotes, downvotes, userKarma }` (extract these from the returned json.data).
     - `voteComment`: Emit `"reddit-new-vote"` with `{ targetId: commentId, targetType: "COMMENT", score, upvotes, downvotes, userKarma }`.
     - `createComment`: Emit `"reddit-new-comment"` with `{ postId, comment: newComment }`.
     - `giveAward`: Emit `"reddit-new-award"` with `{ targetId: postIdOrCommentId, targetType, award: data.data }` (extract award from the returned json.data).
     - `moderatePost`: Emit `"reddit-mod-action"` with `{ subredditId, action, targetPostId: postId, reason }`.
     - `moderateComment`: Emit `"reddit-mod-action"` with `{ subredditId, action: "REMOVE_COMMENT", targetCommentId: commentId, reason }`.
     - `moderateUser`: Emit `"reddit-mod-action"` with `{ subredditId, action, targetUserId, reason }`.

2. **In `src/hooks/useRedditSocket.ts`**:
   - Get `setSocket` from the store: `const setSocket = useRedditStore((s) => s.setSocket);`.
   - Add a `useEffect` inside the hook to set the socket in the store when the socket changes:
     ```typescript
     useEffect(() => {
       if (socket) {
         setSocket(socket);
       }
     }, [socket, setSocket]);
     ```

3. **In `src/components/layout/Sidebar.tsx`**:
   - Import `MessageSquare` from `"lucide-react"`.
   - Add a link for Forums in the `NAV_ITEMS` array: `{ href: "/reddit", icon: MessageSquare, label: "Forums" }` (place it e.g. after Explore or Servers).

After implementing, run `npm run type-check`, `npm run lint`, `npm run build`, and `node tests/e2e_runner.js` to ensure everything compiles and all tests pass.
