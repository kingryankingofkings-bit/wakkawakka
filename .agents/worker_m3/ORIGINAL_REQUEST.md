## 2026-06-30T09:36:19Z

You are teamwork_preview_worker. Your working directory is C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_m3.

Your task is to implement the REAL, integrated, database-backed features for Batch 2 (Profiles & Communities).

Follow these exact steps:

1. Verification of current codebase state:
   - Run type-check: `npm run type-check`
   - Run lint: `npm run lint`
   - Run tests: `node tests/e2e_runner.js`
     Ensure everything compiles and passes before you write any new features.

2. Implement Profile Features:
   - **Follow Requests & Approvals**:
     - Update the follow API so that if the target user has `isPrivate: true` in the DB, the follow status is set to `'PENDING'` (in the `Follow` model) and a follow notification is generated.
     - Implement API endpoints `GET /api/users/requests` (fetch incoming pending follow requests) and `PATCH /api/users/requests/[id]` (to approve or reject a request by updating `Follow.status` to `'ACCEPTED'` or deleting the record).
     - Add a "Follow Requests" interface to the `/settings` or `/profile` page, enabling users to accept/reject incoming follow requests.
   - **User Blocking**:
     - Create API route `/api/users/[id]/block` (POST/DELETE to toggle blocking). When a user is blocked, write a record to the `Block` table and remove any existing follow connections between the two users.
     - Update all feed, search, and message API endpoints so that posts, messages, and profiles of blocked users (or users who blocked the viewer) are filtered out of the results.
   - **Spotify Soundtrack Search & Toggle**:
     - Implement a search endpoint `/api/spotify/search` returning a mock array of popular tracks (title, artist, preview URL).
     - In `EditProfileModal.tsx`, add a Visibility Toggle for the soundtrack and a Search Widget to search for tracks and save the selected track metadata (`title - artist | previewUrl`) into `User.profileSoundtrack` in the database.
     - In `ProfileHeader.tsx` / `ProfileSoundtrack.tsx`, check if the soundtrack is enabled, display the selected song, and play the preview audio when clicking the play button using the HTML5 Audio API.

3. Implement Communities & Groups Features:
   - **Join Requests & Membership**:
     - Replace client-side mock lists in `/communities` and `/communities/[id]` with real database-backed states.
     - If the community visibility is `'PRIVATE'`, clicking join creates a `CommunityJoinRequest` with `status: 'PENDING'`.
     - Implement API `GET /api/communities/[id]/requests` (fetch pending join requests) and `PATCH /api/communities/[id]/requests/[requestId]` (approve/reject join request).
     - Add a "Join Requests" management tab in the community page visible to the creator/admins.
   - **Group About Page Editor**:
     - Implement a PATCH API endpoint `/api/communities/[id]` to let community creators/moderators edit description, rules, visibility, avatarUrl, and coverImage.
     - In `/communities/[id]` About tab, show an "Edit About" button for creators/mods that opens a form to save updates via the API.
   - **Post & User Flairs**:
     - Introduce a flair tagging selector (text + background/text colors) when creators post in communities (or assign flairs to members).
     - Save flair information in `CommunityPost` and `CommunityMember` database records (you can run a migration to add `flair` string/JSON columns, or store it serialized in existing text columns if easier).
     - Display these flairs next to post titles and member badges in community pages.

4. Implement Events Features:
   - **RSVP Attendee Lists**:
     - Create endpoint `GET /api/events/[id]/attendees` returning profiles and RSVP statuses.
     - On the events page/card, display attendee avatars grouped by RSVP status ("Going", "Interested").
   - **Month Calendar View**:
     - Add a view toggle (List vs Calendar) in `/events/page.tsx`.
     - Render a monthly calendar grid showing calendar days of the month, highlighting cells with dots for scheduled events, and showing event quick previews.
   - **Community-Linked Events**:
     - Allow events to be created under a community (pre-filling community details).
     - Render an "Events" tab inside `/communities/[id]` showing events linked to that community.

5. Verification & Validation:
   - Ensure all files are cleanly formatted and typed correctly.
   - Run type-check (`npm run type-check`), linting (`npm run lint`), and build verification (`npm run build`).
   - Run tests: `node tests/e2e_runner.js`. All tests must pass successfully.

6. Update integration inventory:
   - Create a section for Batch 2 Features in `C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\integration_inventory.md` and update their status to "Implemented".

Write a detailed handoff report in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\worker_m3\handoff.md and message us when done.
