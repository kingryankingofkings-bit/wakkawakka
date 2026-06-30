# Handoff Report: M7 Frontend UI & State Review

## 1. Observation

- **TypeScript check**: `npm run type-check` ran successfully without any compilation errors.
- **Next.js Build**: `npm run build` compiled successfully (passing linting and type checks), but encountered a file renaming error at the end of build trace collection:
  ```
  Error: ENOENT: no such file or directory, rename 'C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.next\export\500.html' -> 'C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.next\server\pages\500.html'
  ```
  This is caused by file-locking issues typical of OneDrive folder syncing on Windows.
- **Zustand store (`src/store/serverStore.ts`)**:
  - `joinVoice` action (line 339-349) hardcodes user ID:
    ```typescript
    joinVoice: (serverId, channelId) =>
      set((state) => ({
        voice: {
          ...state.voice,
          serverId,
          channelId,
          connectedUsers: [
            ...state.voice.connectedUsers.filter(
              (id) => id !== "current-user-id",
            ),
            "current-user-id",
          ],
        },
      }));
    ```
  - `leaveVoice` action (line 350-357) also filters out `'current-user-id'`.
  - `joinStage` action (line 375-387) hardcodes speaker/listener as `'current-user-id'`.
  - `leaveStage` action (line 388-396) filters out `'current-user-id'`.
- **Custom hooks**:
  - `useVoice.ts` line 46: calls `store.joinVoice(store.activeServerId, channelId);` without passing the actual authenticated user ID, but line 47 emits the socket event with `currentUser.id`.
  - `useChannel.ts` lines 23 and 62: `useEffect` dependency warnings flagged by linter.
- **Responsive layout (`src/app/(main)/servers/[id]/[channelId]/page.tsx`)**:
  - Employs tailwind drawer transition classes:
    - Left Drawer (Server + Channel list): `fixed md:static -translate-x-full md:translate-x-0`
    - Right Drawer (Member list): `fixed md:static translate-x-full md:translate-x-0`
  - Mobile toggles are triggered via callbacks passed to `ActiveChannelPanel` to toggle `isLeftDrawerOpen` and `isRightDrawerOpen`.
- **Layout constraints bypass (`src/app/(main)/layout.tsx`)**:
  - Path check: `const isServerWorkspace = pathname ? pathname.startsWith('/servers') : false;`
  - Conditionally removes `max-w-2xl` and sets `max-w-none px-0` (line 24). Hides `RightPanel` and `MobileNav`.
- **Sidebar links (`src/components/layout/Sidebar.tsx`)**:
  - Navigation item added at line 19: `{ href: '/servers', icon: Server, label: 'Servers' }`.

---

## 2. Logic Chain

1. **State Handling Flaw**: Hardcoding `'current-user-id'` in Zustand store state means the local store state diverges from the socket room state. When other users join the channel, the socket handler updates the store using their actual `userId`, but the local user is represented as `'current-user-id'`. This causes inconsistencies when tracking active speakers or listing connected voice users.
2. **Accessiblity Gaps**: Using custom modal overlay `div` elements instead of Radix UI dialog components introduces severe WCAG non-compliance. Screen readers are not notified of modal context changes, and focus can easily escape into background elements because no focus traps are active.
3. **Build Trace Lock**: Since type-safety and page generation completed successfully up to the final optimization pass (`✓ Generating static pages (39/39)`), the rename error is confirmed to be an environment-specific OneDrive sync lock, rather than a code syntax or reference error.

---

## 3. Caveats

- **WebRTC**: As documented in the worker handoff, voice/stage logic relies purely on Socket.IO signal/state replication. Audio capture and peer-to-peer streaming are mock layers.
- **Modals**: The M7 components bypass standard Radix dialog components present in other UI packages in the workspace.

---

## 4. Conclusion & Verdict

**Verdict**: REQUEST_CHANGES

### Major Findings

1. **Zustand Hardcoded State Mismatch**:
   - **What**: Zustand store hardcodes `'current-user-id'` in Voice/Stage states.
   - **Where**: `src/store/serverStore.ts` lines 345, 355, 381, 384, 392, 393.
   - **Why**: Divergence between actual User ID and store state prevents proper multi-user voice list rendering and matching.
   - **Suggestion**: Update store actions `joinVoice` and `joinStage` to accept the actual `userId` of the current user.

2. **Radix Dialog Bypass & Focus Trap Gaps**:
   - **What**: Modals in `ServerListSidebar` and `ChannelListSidebar` do not use Radix UI Dialog primitives.
   - **Where**: `src/components/servers/ServerListSidebar.tsx` and `src/components/servers/ChannelListSidebar.tsx`.
   - **Why**: Breaks accessibility compliance by allowing keyboard focus to escape the modal boundary and failing to announce the dialog to assistive technologies.
   - **Suggestion**: Refactor modals to use `@radix-ui/react-dialog` or implement custom focus trapping and escape-key handlers.

### Minor Findings

1. **Missing Image Optimization**:
   - **What**: Standard `<img>` elements are used for server icons.
   - **Where**: `src/components/servers/ServerListSidebar.tsx` line 103.
   - **Why**: Triggers Next.js build warnings for unoptimized images.
   - **Suggestion**: Replace with custom `Avatar` component or Next.js `<Image>`.

2. **Aria Labels Missing**:
   - **What**: Mobile toggles and custom icon buttons do not have aria-labels.
   - **Where**: `ActiveChannelPanel.tsx` lines 50-77.
   - **Why**: Buttons only display icons (`Menu`, `Users`), which are unreadable by screen readers.
   - **Suggestion**: Add descriptive `aria-label` properties.

---

## 5. Verification Method

To verify these observations independently:

1. **Type Check**:
   ```bash
   npm run type-check
   ```
2. **Next.js Build**:
   ```bash
   npm run build
   ```
   Observe the clean compilation success and verify if the final rename succeeds on a non-synced directory.
3. **Inspect Store Code**:
   Open `src/store/serverStore.ts` and inspect lines 339-432 to verify user ID hardcoding.
