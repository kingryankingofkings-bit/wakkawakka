# Wakka Wakka Batch 2 Analysis & Proposals: Profiles & Communities

## 1. Executive Summary
This analysis report evaluates the requirements for **Batch 2: Profiles & Communities** (Milestone 2) of the Wakka Wakka Social Network. It details the exact count of Batch 2 features found in the implementation tracker, reviews the current state of the codebase (routes, components, and database models), identifies key functional gaps, and proposes a set of real, fully-integrated features across Profiles, Communities/Groups, and Events to transition the application from simulated mock data to a fully persistent, database-backed implementation.

---

## 2. Feature Tracking & Classification
By parsing `implementation_tracker.md`, we identified all features mapped to Batch 2. 

- **Total Count of Batch 2 Features**: **240 features**
- **Core Category**: All 240 features are classified under the **Interpersonal & Community Engagement** category in the tracker.
- **Tracker Status**: Listed as "Implemented" in the tracker, but notes indicate they were only "Integrated into the profiles & communities console component and simulations." In reality, many of these features lack full functional integration with the backend database and API layer, serving as interactive client-side simulations.

The 240 features span several functional areas including:
- Interactive Prompts & Engagement (e.g., "Add Yours" prompts, collaborative posts)
- Badging & Verification (e.g., Affiliation badges, organization verification)
- Communication Hubs (e.g., Broadcast channels, group chats, live audio/video rooms)
- Group Administration (e.g., Roles delegation, onboarding questionnaires, moderation queues)
- Event Coordination (e.g., RSVP calendar, event schedulers, attendance trackers)

---

## 3. Codebase Scan: What Exists vs. What is Missing
A comprehensive scan of the codebase reveals that while the database schema (`schema.prisma`) is well-defined, the frontend components and routes are heavily reliant on static mock data and local client state.

### 3.1. Database Models (`prisma/schema.prisma`)
The PostgreSQL schema defines robust relations that perfectly support Batch 2:
- **Profiles**: `User` model containing metadata (`isPrivate`, `theme`, `accentColor`, `profileTheme`, `profileSoundtrack`, etc.), `Follow` (with `status` enum support for `PENDING`/`ACCEPTED`), and `Block` models.
- **Communities**: `Community`, `CommunityMember` (with roles like `ADMIN`, `MODERATOR`, `MEMBER`), `CommunityPost` (with likes/comments), and `CommunityJoinRequest` (supporting private community approvals with `status: PENDING | APPROVED | REJECTED`).
- **Events**: `Event` and `EventAttendee` (supporting `status: GOING | INTERESTED | DECLINED | INVITED`).

### 3.2. Profiles
* **What Exists**:
  * `/profile/[username]/page.tsx` displays user metadata, custom background themes (Ocean Depth, Warm Sunset, Neon Aurora, Midnight Glass), and accent colors.
  * Tab reordering is supported in the UI (`EditProfileModal.tsx`) and persists to client state (`profileTabOrder` array).
  * Profile Soundtrack component (`ProfileSoundtrack.tsx`) handles disc spinning animations and note styling, but lacks actual audio playing and Spotify API search.
* **What is Missing**:
  * **Follow Requests & Approvals**: If a profile is private (`isPrivateLocked`), there is no way for the target user to see incoming requests, accept, or reject them. It only toggles a local state "Pending".
  * **Blocking Flow**: The block dropdown button does not perform any database write or filter feed posts.
  * **Soundtrack Toggle**: Users cannot toggle the soundtrack widget visibility without deleting the URL, and there is no search client.

### 3.3. Communities
* **What Exists**:
  * `/communities/page.tsx` shows joined and discoverable communities.
  * `/communities/[id]/page.tsx` provides tabs for Posts, Members, Requests, About, and Rules.
  * Approving/rejecting join requests (Marcus Aurelius and Ada Lovelace) is implemented as mock client-state functions.
* **What is Missing**:
  * **About Page Editor**: Group creators/admins cannot edit the community description, cover images, rules, or categories.
  * **Custom Flairs**: No interface or DB capability to assign flair badges (e.g., "Staff", "Question") to community posts or user names.
  * **Real Join Requests Persistence**: No real fetching of `CommunityJoinRequest` records; they are generated dynamically in mock arrays.

### 3.4. Events
* **What Exists**:
  * `/events/page.tsx` displays upcoming, hosting, and past events.
  * RSVP buttons optimistically update going/interested counters and fire requests to `/api/events/[id]/rsvp`.
  * Event creation modal submits form fields to `/api/events`.
* **What is Missing**:
  * **Calendar View**: No month/grid view or visual scheduler, only cards.
  * **RSVP Attendee Lists**: Users cannot see who else is attending or interested in an event.
  * **Community Association**: Events are created globally and cannot be tied to a specific community page.

---

## 4. Proposed Features & Integration Design for Batch 2

To move Batch 2 to a fully-functional state, we propose implementing the following integrated features:

### 4.1. Profile Features

#### Proposal A: Private Account Follow Queue & Notification Sync
* **Description**: Complete the private account workflow where follow requests are stored as `PENDING` in the database, and the target user can review, accept, or reject requests.
* **Implementation Steps**:
  1. Update `POST /api/users/[id]/follow` to check the target's `isPrivate` status. If true, set `Follow.status = 'PENDING'` and create a `Follow` notification.
  2. Implement `GET /api/users/requests` to retrieve all pending follow requests.
  3. Create a **Follow Requests Manager UI** (integrated either in `/profile` or settings) showing a list of request cards with Accept/Reject buttons, calling `PATCH /api/users/requests/[id]`.
  4. Update `ProfileHeader.tsx` to read the real follow status (`PENDING`/`ACCEPTED`/`NONE`) and show "Requested" when status is `PENDING`.

#### Proposal B: User Blocking & Feed Filtering
* **Description**: Connect the "Block @username" button to a database action that cuts off all social interactions.
* **Implementation Steps**:
  1. Implement `POST /api/users/[id]/block`. When called, it inserts a record into the `Block` table and deletes existing mutual follows.
  2. Modify search, feed, and messaging API routes to filter out posts/messages where the author is blocked or has blocked the viewer:
     ```typescript
     where: {
       authorId: {
         notIn: blockedUserIds
       }
     }
     ```
  3. Show a "You have blocked this user" overlay on `/profile/[username]` if the blocker visits the blocked user, and a "User not found" error if the blocked user tries to visit the blocker.

#### Proposal C: Spotify Soundtrack Integration & Display Toggle
* **Description**: Enable users to search for real music tracks and toggle the visibility of the audio widget.
* **Implementation Steps**:
  1. Add a boolean field `profileSoundtrackEnabled` to the `User` model.
  2. In `EditProfileModal.tsx`, add a checkbox to toggle the soundtrack on/off.
  3. Create an API route `GET /api/spotify/search?q=...` that queries the Spotify API (or a mock service) returning a list of tracks with title, artist, and a 30-second preview URL. Provide a search input inside the widget section to pick a song rather than paste raw URLs.

---

### 4.2. Communities & Groups Features

#### Proposal A: Persistent Community Membership & Join Requests
* **Description**: Integrate the community join and moderation requests with the existing Prisma API endpoints.
* **Implementation Steps**:
  1. Replace client-side states in `/communities/page.tsx` and `/communities/[id]/page.tsx` with calls to `POST /api/communities/[id]/join`.
  2. In the "Requests" tab of `/communities/[id]/page.tsx`, query `/api/communities/[id]/requests` to get real `CommunityJoinRequest` entries.
  3. Connect the Approve/Reject buttons to `PATCH /api/communities/[id]/join` with `action: 'approve' | 'reject'`.

#### Proposal B: Group Profile & About Page Editor
* **Description**: Provide community creators and admins the ability to customize their group's appearance, description, and rules.
* **Implementation Steps**:
  1. Add an "Edit About" button in `/communities/[id]/page.tsx` visible only to creators or moderators.
  2. On click, open a modal with fields: Description, Rules (array of strings), Cover Image URL, and Avatar URL.
  3. Implement `PATCH /api/communities/[id]` which validates the user's role and updates the `Community` record in Prisma.

#### Proposal C: Custom Flairs & Badges
* **Description**: Introduce user and post flairs in communities to recognize roles and organize topics.
* **Implementation Steps**:
  1. Update `schema.prisma` to include a `Flair` model:
     ```prisma
     model Flair {
       id          String   @id @default(cuid())
       communityId String
       community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
       name        String
       textColor   String
       bgColor     String
       type        String   // "POST" or "USER"
     }
     ```
  2. Let admins create flairs in a new "Flair Settings" modal.
  3. Allow users to select a "Post Flair" when posting, and show "User Flairs" next to names in community discussions.

---

### 4.3. Events Features

#### Proposal A: RSVP Attendance Registry
* **Description**: Allow event attendees to see other users who are "Going" or "Interested" to boost social proof.
* **Implementation Steps**:
  1. Create the endpoint `GET /api/events/[id]/attendees` returning a list of attendees with their RSVP status and user profiles.
  2. Add an "Attendees" section to the Event Card or a dedicated event drawer that loads these user avatars. Group them into "Going" and "Interested" tabs.

#### Proposal B: Monthly Calendar & Scheduler View
* **Description**: Add a layout toggle to view events in a visual monthly calendar grid, facilitating better planning.
* **Implementation Steps**:
  1. In `src/app/(main)/events/page.tsx`, add a view toggle: List vs. Calendar.
  2. Write a Calendar Grid component that calculates the current month's days, maps events to their starting dates, and displays small event dots on each calendar cell.
  3. Clicking a cell displays a popover with full event details and RSVP quick actions.

#### Proposal C: Community-Linked Events
* **Description**: Enable communities to host events, linking local groups with scheduled calendars.
* **Implementation Steps**:
  1. Add an optional `communityId` field to the `Event` model in `schema.prisma`.
  2. When creating an event, if the user starts from a community page, pre-fill and lock the `communityId`.
  3. In `/communities/[id]/page.tsx`, add an "Events" tab displaying events associated with the community.
