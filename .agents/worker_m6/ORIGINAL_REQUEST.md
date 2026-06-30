## 2026-06-30T10:36:41Z
Implement the REAL, integrated, database-backed features for Batch 5 (E-Commerce, Creator Tools, Analytics, APIs) in C:\Users\Kingr\OneDrive\Documents\wakkawakka-local.

## 2026-06-30T10:46:12Z
We have received new requirements from a platform audit. You must implement the following 13 feature gaps and corrections in your current pass:

### 1. Database Schema Updates:
- Update `prisma/schema.prisma` to add necessary models:
  - `Fundraiser` (id, creatorId, title, description, goalAmount, raisedAmount, status, createdAt) and `FundraiserDonation` (id, fundraiserId, donorId, amount, createdAt).
  - `DatingProfile` (id, userId, bio, prompts, lookingFor, matches, crushes, datingEvents) or add fields to User.
  - `AdPlacement` (id, adId, type, page) - support WhatsApp Ads placements.
  - `Bounty` (id, creatorId, title, description, rewardAmount, status, participantsCount).
  - `WebhookSubscription` and `WebhookDeliveryLog` (as previously defined).

### 2. Implementation of Gaps:
1. **Facebook Dating (`/dating` page)**:
   - Build a `/dating` page with:
     - Profile setup (dating bio, prompts).
     - Swipe/match simulator UI (displaying discoverable dating cards with Like/Pass buttons, persisting matches to the database).
     - Secret Crush setup (adding usernames to a secret crush list; if two users crush each other, trigger a MATCH).
     - Dating Events calendar (calendar listing local/online single mixers events).
2. **Facebook Fundraisers (`/fundraisers` page)**:
   - Build endpoints `GET/POST /api/fundraisers` and `/api/fundraisers/[id]/donate` to create charitable campaigns, track goal progress bars, and simulate credit card donation processing.
   - Build `/fundraisers` frontend to display campaigns, progress bars, and a donation checkout modal.
3. **Facebook Gaming (`/gaming` page)**:
   - Build a `/gaming` page featuring a list of gaming streams/tournaments, a tournament signup/creation form, and simulated instant games (interactive canvas/iframe HTML5 games, e.g. Tic-Tac-Toe, Pong, or Snake).
4. **Instagram Notes**:
   - Add a lightweight Status Note bar above the DM conversation list in `/messages` (GET/POST `/api/messages/notes` to publish notes that disappear or display for other users).
5. **WhatsApp Flows**:
   - Inside chat window message bubble, support rendering structured interactive forms, checkbox selections, and submit confirmations sent in messages.
6. **WhatsApp Ads**:
   - Display ad placements (using `/api/ads/serve` with target matching) inside Status and Channel update tabs.
7. **Telegram Mini Apps / WebApps**:
   - Allow embedding mini web apps (e.g. mock widgets like weather, calculator, or Tic-Tac-Toe) inside a chat message, launching them in a modal webview directly from the chat bubbles.
8. **Discord Activities**:
   - Support launching social activities (in-channel games or screenshare simulations) inside chat panels/channels.
   - Show active member avatars joining the activity in the channel.
9. **Kick Bounties (`/bounties` page)**:
   - Build a `/bounties` creator page listing active incentives (e.g. "Stream for 5 hours", "Get 100 followers") with task goal trackers, payout amounts, and claims logs.
10. **BeReal BTS**:
    - Update `CreatePostModal.tsx` to allow recording/uploading a short 3-second Behind-The-Scenes video snippet attached to a post, displaying a BTS playback icon on the feed post.
11. **Bluesky Labelers**:
    - Update the `/admin/moderation` page to support custom moderation label creation (e.g., "NSFW", "Clickbait", "Misinformation") and let admins attach labels to posts, filtering feed posts if labels match user preferences.
12. **Threads Highlighter**:
    - In the explore/feed pages, spotlight trending threads with a distinct highlighted ring or background glow.
13. **TikTok Green Screen Kit**:
    - Enhance `CreatePostModal` media uploader to act as an asset feeder, allowing users to combine background templates/images with active uploads.

### 3. Corrections / Adjustments:
- **Apaya/Publer (AI Content Scheduling & Automation)**:
  - Add a **Content Scheduling & Automation Dashboard** under a `/scheduling` route or in the Creator section:
    - AI content generation (input brand voice prompts, generate post copy using mock LLM endpoint).
    - Multi-platform scheduling calendar displaying scheduled slots.
    - Automatic posting logic processing posts when `scheduledAt <= now`.
- **Buz**: Keep to push-to-talk audio messaging, async playback, and simple file sharing. Omit any unverified extra features.
- **Lemon8 & BAND**: Keep to standard identity lifestyle template feeds, group files directories, and group chat.
