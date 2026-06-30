## 2026-06-30T13:50:57-07:00

Implement frontend and UI integration fixes for Batch 10 (Camera & AR) remediation.

Your identity: worker_b10_remediation_frontend
Working directory: C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b10_remediation_frontend

Tasks:
1. Modify `src/components/camera/CameraCapture.tsx` to replace mock client-side Zustand store updates/localstorage bypass with real backend API calls.
   - When cameraMode is BE_REAL: fetch "/api/posts/bereal" (POST) and add the resulting post.
   - When cameraMode is DISAPPEARING: fetch "/api/media/disappearing" (POST) to create the disappearing media in the database, and then fetch "/api/messages/conversations/[id]/messages" (POST) to send the message.
   - For other modes: fetch "/api/posts" (POST) to create the story/post.
   - Save the memory in the database by calling fetch "/api/memories" (POST) with the metadata.
   - Trigger the activity streak by fetching "/api/streaks/activity" (POST) and updating user state with the returned streak value.
2. Modify `src/app/(main)/memories/page.tsx` to fetch and delete memories from the database APIs.
   - Replace the localStorage read inside `useEffect` with a GET fetch to `/api/memories`.
   - Replace the local deletion inside `handleDeleteMemory` with a DELETE fetch to `/api/memories/[id]`.
3. Modify `src/store/mapStore.ts` to implement real location actions.
   - Add actions `fetchFriendsLocations` (which calls `/api/location/friends` and sets `friendsLocations` array) and `updateUserLocation` (which posts coordinate changes to `/api/location/update` and sets `userLocation` and `isSharingLocation`).
   - Remove hardcoded friend location data arrays; initialize `friendsLocations` as empty and populate it dynamically from the API call.
4. Modify `src/app/(main)/map/page.tsx` to use the new map actions:
   - Call `fetchFriendsLocations` and `updateUserLocation` on mount and set up an interval to refresh friend locations.
   - Update user location on map interaction or settings toggle, using real geolocation coordinates if available or fallback San Francisco defaults.
5. Run build and verify that Next.js compiles and all integration tests (`node tests/camera_ar_test.js`) pass.
6. Write a handoff report in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_b10_remediation_frontend\handoff.md.
