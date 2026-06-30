# Integration Inventory

This inventory tracks the real features to be implemented in Batch 1.

## Batch 1 Features

| Feature                            | Description                                                        | Status      |
| ---------------------------------- | ------------------------------------------------------------------ | ----------- |
| **Post & Message Reactions**       | Incorporating DB persistence using Like and MessageReaction models | Implemented |
| **Real Voice Messages**            | Recording, upload, message save, playback UI                       | Implemented |
| **Content Moderation & Reporting** | Report endpoint, admin moderation queue UI                         | Implemented |

## Batch 2 Features

| Feature                                | Description                                                                        | Status      |
| -------------------------------------- | ---------------------------------------------------------------------------------- | ----------- |
| **Follow Requests & Approvals**        | Private profiles follow toggle set status to `'PENDING'`, approve/reject dashboard | Implemented |
| **User Blocking**                      | Blocks query filters feed, search, and profiles                                    | Implemented |
| **Spotify Soundtrack Search & Toggle** | Spotify search, visibility toggle, custom HTML5 Audio player on profile            | Implemented |
| **Communities: Join Requests**         | Private community requests set status to `'PENDING'`, join request approvals       | Implemented |
| **Group About Page Editor**            | Moderation PATCH endpoints for community description, visibility, and rules        | Implemented |
| **Post & User Flairs**                 | Text, bg, and text color custom flairs for community posts and members             | Implemented |
| **Events RSVP Attendee Lists**         | Group attendees by Going vs Interested in details list modal                       | Implemented |
| **Events Calendar View**               | Monthly calendar view with event dots and preview cards                            | Implemented |
| **Community-Linked Events**            | Community creation and scheduling of events, tab rendering                         | Implemented |

## Batch 3 Features

| Feature                           | Description                                                                                                                                                                       | Status      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Ephemeral Stories**             | Group active stories by author, active/viewed border ring styling, mark-as-read DB view creation, and upload uploader                                                             | Implemented |
| **Advanced Feeds & Comments**     | For You decay algorithm ranking score, scheduled posts future-date filters, atomic reactions count transaction updates, root comments retrieval and nested reply tree persistence | Implemented |
| **Database-driven Search & Tags** | Prisma text contains DB search filters, User search block-filters, saved search history log, and hashtag querying                                                                 | Implemented |
| **Content Creation & Reels**      | Reels DB-driven tab, CreatePostModal video format restrictions, media preview alt-text textfields, and schedule publication date/time                                             | Implemented |

## Batch 4 Features

| Feature                              | Description                                                                                                                                                                                                                                                                                             | Status      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Direct Messaging & Communication** | Real integrated database-backed API endpoints for conversations, messages and member management, Socket.io status and typing indicators, simulated E2EE (AES-GCM) secure toggle, in-chat search text highlighting, and sliding info sidebar with participant search/add widget and shared media gallery | Implemented |

## Batch 5 Features

| Feature                       | Description                                                                                                 | Status      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------- |
| **Monetization & E-Commerce** | Integrated checkout, cart, product card, shop page, ads serving, dating profiles, fundraisers, and bounties | Implemented |
| **Creator Tools & Analytics** | Analytics, gaming, and Apaya AI Content Scheduling Dashboard                                                | Implemented |
| **APIs & Webhooks**           | Developer webhooks, settings developer portal, in-app messaging note route, and message bubble styling      | Implemented |

## Batch 6 Features

| Feature                             | Description                                                                                                                  | Status      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Live Streaming & Video Platform** | Twitch/Kick style stream host, Socket.IO stream chat, channel points and predictions, clips creation, and VOD watch archive. | Implemented |

## Batch 7 Features

| Feature                                       | Description                                                                                                                                                  | Status      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| **Discord-style Server/Channel Architecture** | Multi-column server UI, channel types (text, voice, forum, stage), custom roles & permissions hierarchy check, server boosts, custom emojis, and soundboard. | Implemented |

## Batch 8 Features

| Feature                 | Description                                                                                                                                                                                                                                                   | Status      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Professional & Jobs** | LinkedIn-style career fields, skill endorsements, user recommendations, jobs listings and programmatic applications, company pages with jobs and follow hooks, premium InMail message gating, course library catalogs with enrollment progress, and newsletter publishing. | Implemented |

## Gap Features

| Feature                                      | Description                                                                             | Status      |
| -------------------------------------------- | --------------------------------------------------------------------------------------- | ----------- |
| **Threads Highlighter**                      | Gold border styling and a spotlight thread badge for high-engaging feed posts           | Implemented |
| **Apaya AI Content Scheduling & Automation** | Month calendar grid, Brand voice profile form, AI post copy generator, and queue poster | Implemented |
| **Avatar Story Ring**                        | Correct active story ring rendering using the animated CSS helper                       | Implemented |

## Batch 9 Features

| Feature | Description | Status |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Forum & Voting (Reddit-style)** | Subreddit-style topic communities with custom rules, upvote/downvote system with karma, award/gift system, crossposting, AMA format, and mod tools (automod rules, mod queue). | Implemented |

## Batch 10 Features

| Feature | Description | Status |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Camera & AR (Snapchat/BeReal-style)** | Mobile-only camera interface, AR lenses and filters, Snap Map real-time location sharing, disappearing (view-once) direct messages, streaks tracking, BeReal dual-camera ephemeral capture, and memories private vault. | Implemented |
