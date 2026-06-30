# Handoff Report — explorer_b6_3

## 1. Observation

We directly observed files, libraries, and component logic in the following locations within the codebase:

- **Zustand & React Query Dependencies**:
  - `package.json` line 36: `"@tanstack/react-query": "^5.32.0",`
  - `package.json` line 60: `"zustand": "^4.5.2"`
- **Live Page Code (`src/app/(main)/live/page.tsx`)**:
  - Line 11: `import { MOCK_LIVE_STREAMS, MOCK_USERS } from '@/lib/mockData';` (indicates that mock data is used directly).
  - Lines 65-70:
    ```typescript
    const [viewing, setViewing] = useState<LiveStream | null>(stream || null);
    const [comments, setComments] = useState<LiveComment[]>(
      MOCK_LIVE_STREAMS[0]?.comments || [],
    );
    const [commentText, setCommentText] = useState("");
    const [showGifts, setShowGifts] = useState(false);
    const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
    const [viewerCount, setViewerCount] = useState(
      MOCK_LIVE_STREAMS[0]?.viewerCount || 0,
    );
    ```
  - Lines 81-101: A local `useEffect` simulating live comments with `setInterval` every 2500ms using local React states:
    ```typescript
    setComments((prev) => [...prev.slice(-50), newComment]);
    ```
- **Existing Database Models (`prisma/schema.prisma`)**:
  - Lines 556–587: The database already has the `LiveStream`, `LiveStreamCoHost`, and `LiveStreamGift` models:
    ```prisma
    model LiveStream {
      id           String   @id @default(cuid())
      hostId       String
      host         User     @relation("LiveStreamHost", fields: [hostId], references: [id], onDelete: Cascade)
      ...
    }
    ```
  - However, it does not currently have `channelPoints` in the `User` model, nor does it have the predictions, bets, or clips tables.

---

## 2. Logic Chain

1.  **Mock States Migration**: The current `live/page.tsx` relies exclusively on simulated client-side states (`setComments`, `setViewerCount`, etc.) and mock files. To achieve database-persisted functionality, these states must be replaced by remote query hooks (`useQuery`) and mutations (`useMutation`) linked to server-side endpoints (e.g. `/api/live/streams/[id]/chat`).
2.  **Shared State Separation**:
    - Server data (active stream metadata, co-hosts list, chat comment list, prediction states, VOD watch records, scheduled streams) needs to be fetched and cached via React Query.
    - Client UI states (simulation controls, custom emote picker toggle, fullscreen mode, transient confetti/heart animation triggers) should be handled by a global Zustand store (`useLiveStore`).
3.  **Real-Time Sync**: Since streaming interactions (such as chat comments, tip alerts, and active prediction bets) are highly concurrent, integrating Socket.IO is necessary. We need to implement a websocket connection layer that updates the React Query cache or triggers local Zustand animated arrays when events are received from the server.
4.  **Layout and Responsiveness**:
    - Mobile viewports lack the width to support side-by-side elements. Therefore, a tabbed navigation panel below the video player is required to toggle between Chat, Predictions, and Stream Info.
    - Desktop viewports require a column-grid layout to display the player and interactive sidebar chat simultaneously.

---

## 3. Caveats

- **API Implementations**: The backend REST API endpoints (`/api/live/*`) and WebSockets handlers do not exist yet. The implementer must construct these handlers in tandem with the frontend components.
- **Prisma Migration**: The database models for predictions, bets, and clips must be added and applied (`prisma db push`) before the frontend queries can retrieve actual data.
- **Authentication**: The helper `getRequestUserId(req)` in the backend must be integrated with the client authentication token (managed in `authStore.ts`).

---

## 4. Conclusion

1.  We have audited the state management requirements and proposed a concrete architecture utilizing React Query for persistent server records and Zustand for visual drawer toggles.
2.  We have provided a detailed Socket.IO event handler design to synchronize chat commentary, gifts, and predictions in real time.
3.  We have mapped out responsive grid specifications and CSS structure for mobile vs. desktop layouts.
4.  We have created a full UI analysis report including state models and layout schemas in `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_b6_3\analysis.md`.

---

## 5. Verification Method

To verify project type safety and compile capabilities after implementing the changes:

1.  **TypeScript Verification**: Ensure no compile-time or type errors exist:
    ```powershell
    npm run type-check
    ```
2.  **E2E Integration Checks**: Execute the project test suite to verify route and handler consistency:
    ```powershell
    node tests/e2e_runner.js
    ```
3.  **Inspect files**: Inspect the generated files `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\explorer_b6_3\analysis.md` and `handoff.md` to verify the findings.
