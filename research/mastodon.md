# Mastodon Feature Research

This document compiles the feature research for Mastodon, categorized into the reconciled 10-category taxonomy. Each category contains exactly 5 unique, specific, and actionable features, totaling 50 features.

---

## Category 1: Content Creation & Editing

### 1. Mastodon Content Warning

- **Category**: Content Creation & Editing
- **Description**: Allows users to hide the text or media of their post behind a custom spoiler warning text label, requiring readers to click to reveal it.
- **Sub-category / Actionable Details**: Ephemeral Content Flags. In the post composer, click the "CW" button, type your warning label in the text box that appears, and write the main content below it.

### 2. Mastodon Character Count Limits

- **Category**: Content Creation & Editing
- **Description**: Offers a default 500-character text post capacity, though individual federated instances can configure this limit higher or lower.
- **Sub-category / Actionable Details**: Text Post Editor. Open the compose window, enter your message, and check the counter in the bottom corner of the input box which counts down from 500.

### 3. Mastodon Media Formatting & Alt Text

- **Category**: Content Creation & Editing
- **Description**: Attaches alternative text descriptions to photos, videos, and audio uploads to support accessibility tools.
- **Sub-category / Actionable Details**: Accessibility Metadata. After attaching a file using the paperclip icon in the composer, click "Describe for the visually impaired," write your explanation, and click "Apply."

### 4. Mastodon Custom Emojis

- **Category**: Content Creation & Editing
- **Description**: Permits users to insert custom emojis uploaded and managed by the administrator of their specific home instance.
- **Sub-category / Actionable Details**: Instance Custom Emojis. Click the smiley face icon in the post composer to open the emoji selector, and scroll down to your server's custom category to choose a unique graphic.

### 5. Mastodon Post Language Selector

- **Category**: Content Creation & Editing
- **Description**: Tags posts with specific language identifiers to assist other users with translation tools and timeline filtering.
- **Sub-category / Actionable Details**: Post Metadata Tagging. Click the language abbreviation button (e.g. "EN") in the post composer toolbar, and select your written language from the list before posting.

---

## Category 2: Content Discovery & Search

### 6. Mastodon Federated Timeline

- **Category**: Content Discovery & Search
- **Description**: Displays a real-time chronological stream of public posts from users across all external servers that are federated with your instance.
- **Sub-category / Actionable Details**: Fediverse Global Feed. Click the "Explore" tab or the "Federated" timeline link in the right-hand panel of the web interface.

### 7. Mastodon Local Timeline

- **Category**: Content Discovery & Search
- **Description**: Shows a real-time chronological stream of public posts written only by users registered on your specific server.
- **Sub-category / Actionable Details**: Local Server Feed. Click the "Local" link in the right-hand navigation panel of the web interface to view your server's localized community posts.

### 8. Mastodon Hashtag Following

- **Category**: Content Discovery & Search
- **Description**: Inserts posts containing specific hashtag topics directly into your main home timeline.
- **Sub-category / Actionable Details**: Hashtag Feed Subscriptions. Search for a hashtag (e.g. `#atproto`) in the search bar, click on it to open its feed, and tap the follow icon (a person with a plus sign) in the header.

### 9. Mastodon Explore Feed

- **Category**: Content Discovery & Search
- **Description**: A curated discovery tab showcasing trending posts, popular hashtags, and recommended users on your server.
- **Sub-category / Actionable Details**: Trending Content Feed. Click the "Explore" tab in the main navigation list. Swipe through the tabs for "Posts," "Tags," "Links," and "Community."

### 10. Mastodon Server Directory

- **Category**: Content Discovery & Search
- **Description**: A searchable directory of federated servers that can be filtered by topic, language, and signup policies.
- **Sub-category / Actionable Details**: Instance Discovery Portal. Access via `joinmastodon.org/servers` in a browser, and use the filter buttons to search for instances that fit your interest.

---

## Category 3: Interpersonal & Community Engagement

### 11. Mastodon Local Server Rules

- **Category**: Interpersonal & Community Engagement
- **Description**: Outlines instance policies that users must agree to during signup and follow to avoid account suspension.
- **Sub-category / Actionable Details**: Server Community Guidelines. Viewable on the landing page of any instance (e.g., `server.domain/about`). Users must check the box agreeing to these rules during registration.

### 12. Mastodon Direct Reblogs

- **Category**: Interpersonal & Community Engagement
- **Description**: Shares public posts directly to your followers' feeds, preserving the original author's federated identity.
- **Sub-category / Actionable Details**: Content Amplification. Click the circular arrows icon (Boost) below a post. The post will be shared and show your boost action.

### 13. Mastodon Group Accounts

- **Category**: Interpersonal & Community Engagement
- **Description**: Automated community accounts that re-share any post mentioning their handle to all their followers.
- **Sub-category / Actionable Details**: Group Mentions. Search for a group profile (e.g. `@group@domain.org`), follow it, and mention its handle in your posts to federate your content to the group's followers.

### 14. Mastodon Server Migration Tool

- **Category**: Interpersonal & Community Engagement
- **Description**: Moves your profile, followers, blocks, and mutes from one server instance to another without losing your social graph.
- **Sub-category / Actionable Details**: Fediverse Profile Relocation. In settings on your old account, go to Account > Moving to a different account. Input the new account handle, then on the new account configure the alias link under Account > Moving from a different account.

### 15. Mastodon Custom Lists

- **Category**: Interpersonal & Community Engagement
- **Description**: Creates custom timeline views of selected users to track their activity without cluttering your main feed.
- **Sub-category / Actionable Details**: Content Stream Groups. Click "Lists" in the navigation pane, tap "New List," name it, and add accounts using the search tool or from your following list.

---

## Category 4: Direct Messaging & Communication

### 16. Mastodon Private Mention Visibility

- **Category**: Direct Messaging & Communication
- **Description**: Restricts post visibility to only people mentioned in the post, acting as a direct message within the federated network.
- **Sub-category / Actionable Details**: Visibility Controls. Tap the globe or lock icon in the post composer to open the privacy menu, and select "Mentioned people only."

### 17. Mastodon DM Filtering

- **Category**: Direct Messaging & Communication
- **Description**: Filters out private mention posts from users you do not follow into a separate review tab.
- **Sub-category / Actionable Details**: Message Inbox Filtering. Open Preferences > Notifications. Under the notifications filtering options, check "Filter private mentions from non-followings."

### 18. Mastodon DM Notification Alerts

- **Category**: Direct Messaging & Communication
- **Description**: Configures distinct alert behaviors for posts set to "Mentioned people only" to distinguish them from public mentions.
- **Sub-category / Actionable Details**: Private Message Alerts. Access Preferences > Notifications. Toggle the specific desktop notification or email alert checkboxes for "Private Mention."

### 19. Mastodon Direct Message History

- **Category**: Direct Messaging & Communication
- **Description**: Compiles all posts with "Mentioned people only" visibility into a dedicated, scrollable Direct Messages interface.
- **Sub-category / Actionable Details**: Direct Message Timeline. Click the "Direct Messages" or "Chats" link in the right-hand panel of the web interface to view private conversations.

### 20. Mastodon Chat Link Integrations

- **Category**: Direct Messaging & Communication
- **Description**: Allows users to paste video conference or private chat links inside direct posts, formatting them as clickable badges.
- **Sub-category / Actionable Details**: Call Link Formatting. Paste a meeting URL (e.g. from Jitsi) inside a "Mentioned people only" post. The system parses and formats it as a secure call button.

---

## Category 5: Monetization & E-Commerce

### 21. Mastodon Admin Donation Pages

- **Category**: Monetization & E-Commerce
- **Description**: Displays instance-wide crowdfunding links (like Patreon, Open Collective, or LiberaPay) on the server's landing page.
- **Sub-category / Actionable Details**: Server Funding Info. Viewable by visiting `server.domain/about`. Admins configure these links under Admin Settings > Site Settings > Funding.

### 22. Mastodon Creator Profile Tip Links

- **Category**: Monetization & E-Commerce
- **Description**: Provides verified tip and donation link buttons on user profiles via structured metadata table fields.
- **Sub-category / Actionable Details**: Profile Metadata Configuration. Open Preferences > Profile > Appearance. Add a label (e.g. "Patreon") and paste your payment URL into the metadata row fields.

### 23. Mastodon Verified Link Sponsorships

- **Category**: Monetization & E-Commerce
- **Description**: Uses rel="me" link tags to verify ownership of external store links, displaying them in green on the user's profile.
- **Sub-category / Actionable Details**: E-commerce Verification. Add a link to your store (e.g. Shopify site) in your profile metadata. Add the tag `rel="me"` to the link on your store page to trigger the green checkmark.

### 24. Mastodon Server Membership Fees

- **Category**: Monetization & E-Commerce
- **Description**: Allows server administrators to gate registration behind required contributions or subscriptions.
- **Sub-category / Actionable Details**: Server Gatekeepers. Configured by admins in Admin Settings > Registration. Select "Requires donation/subscription" and paste payment gateways for checkout.

### 25. Mastodon Commercial Affiliate Links

- **Category**: Monetization & E-Commerce
- **Description**: Supports publishing affiliate product links with custom descriptions, making links easy to read without tracking parameters.
- **Sub-category / Actionable Details**: Affiliate Links. Paste the URL containing your affiliate tag in the composer. Mastodon parses the destination domain, removing raw tracker strings while maintaining your affiliate ID.

---

## Category 6: Analytics, Business & Creator Tools

### 26. Mastodon Public Post Statistics

- **Category**: Analytics, Business & Creator Tools
- **Description**: Displays total reblogs (boosts), favorites, and replies on individual posts across federated servers.
- **Sub-category / Actionable Details**: Post Engagement Counters. Tap or click on any individual post to open its detailed view, showing the counts next to the action icons.

### 27. Mastodon Server Stats API

- **Category**: Analytics, Business & Creator Tools
- **Description**: A public API endpoint that outputs general instance statistics including total users, active users, and post counts.
- **Sub-category / Actionable Details**: Server Analytics Query. Developers fetch the JSON payload by making an HTTP GET request to `https://server.domain/api/v1/instance/activity` or `https://server.domain/api/v2/instance`.

### 28. Mastodon Column Layout

- **Category**: Analytics, Business & Creator Tools
- **Description**: An advanced web user interface featuring multiple scrollable columns for monitoring timelines, notifications, and custom lists simultaneously.
- **Sub-category / Actionable Details**: Multi-column Workspace. Navigate to Preferences > Appearance, check "Enable advanced web interface," and save changes to transform your dashboard.

### 29. Mastodon Profile Metadata Fields

- **Category**: Analytics, Business & Creator Tools
- **Description**: Allows users to define up to 4 custom label-value metadata pairs to showcase links, pronouns, or professional details.
- **Sub-category / Actionable Details**: Profile Metadata Manager. Access Preferences > Profile > Appearance. Under the table fields, enter a label (e.g. "Website") and a value (e.g. link or text).

### 30. Mastodon Domain Moderation Analytics

- **Category**: Analytics, Business & Creator Tools
- **Description**: An admin dashboard tracking incoming and outgoing federation traffic, blocked instances, and report volume.
- **Sub-category / Actionable Details**: Moderation Metrics. Access via Admin Settings > Moderation > Federation. Shows graphs of active domains, report resolution rates, and block history.

---

## Category 7: Privacy, Security & Safety

### 31. Mastodon Instance Domain Blocking

- **Category**: Privacy, Security & Safety
- **Description**: Blocks communication with entire external server domains to prevent their users from interacting with your profile.
- **Sub-category / Actionable Details**: Server Domain Blocks. Go to Preferences > Moderation > Domain blocks. Click "Add block," enter the domain of the instance you wish to block, and select the block level.

### 32. Mastodon Automated Post Archiving

- **Category**: Privacy, Security & Safety
- **Description**: Automatically deletes or archives posts that are older than a user-specified duration.
- **Sub-category / Actionable Details**: Automated Cleanup. Navigate to Preferences > Automated post deletion. Toggle the option on, select the age threshold (e.g. one month), and save settings.

### 33. Mastodon Opt-Out of Search Indexing

- **Category**: Privacy, Security & Safety
- **Description**: Requests search engines and internal search utilities not to index the user's posts or profile details.
- **Sub-category / Actionable Details**: Search Visibility Toggle. Go to Preferences > Profile > Appearance. Uncheck "Opt-out of search engine indexing" or check "Require approval for search" to adjust settings.

### 34. Mastodon Profile Approval Requirement

- **Category**: Privacy, Security & Safety
- **Description**: Requires manual approval of all follower requests before they can view your posts and timeline.
- **Sub-category / Actionable Details**: Private Account Toggle. Go to Preferences > Profile > Appearance. Check the box "Require follow requests" and click save to lock down your account.

### 35. Mastodon Report Fediverse Propagation

- **Category**: Privacy, Security & Safety
- **Description**: Forwards a moderation report to the administrators of the user's remote home server for evaluation.
- **Sub-category / Actionable Details**: Cross-server Reporting. Click the three-dot menu on a post or profile, select "Report," select the category, and toggle the switch for "Forward report to remote administrator."

---

## Category 8: Notifications & Time Management

### 36. Mastodon Notification Types Filter

- **Category**: Notifications & Time Management
- **Description**: Filters your notifications feed by category to focus on specific interactions like mentions or boosts.
- **Sub-category / Actionable Details**: Notification Feed Filters. Open the Notifications tab in the dashboard, and select filter buttons at the top (e.g. "Mentions" or "Polls") to refine the display list.

### 37. Mastodon Push Notification Subscriptions

- **Category**: Notifications & Time Management
- **Description**: Uses the Web Push API to send push notifications to mobile or desktop browsers when you are offline.
- **Sub-category / Actionable Details**: Offline Alert Subscriptions. Navigate to Preferences > Notifications > Push notifications, authorize browser permissions, and select event triggers.

### 38. Mastodon Mute and Block Timers

- **Category**: Notifications & Time Management
- **Description**: Temporarily silences notifications or posts from specific users for a set duration before expiring.
- **Sub-category / Actionable Details**: Mute Scheduling. Click the three-dot menu on a user's profile, select "Mute," choose the duration (e.g. 1 hour, 1 day, 1 week, or Indefinite), and click confirm.

### 39. Mastodon Notification Sounds

- **Category**: Notifications & Time Management
- **Description**: Plays customizable audio cues when new notifications are received in the web dashboard.
- **Sub-category / Actionable Details**: Auditory Notifications. Navigate to Preferences > Appearance, scroll down to the notification sounds checkboxes, and check "Play sound for new notifications."

### 40. Mastodon Filter Rules

- **Category**: Notifications & Time Management
- **Description**: Creates rules to hide posts containing specific keywords from notifications, home feeds, and explore views.
- **Sub-category / Actionable Details**: Keyword Filtering. Navigate to Preferences > Filters, click "Add new filter," enter the keywords, choose where to apply the filter (e.g. Home feed), and set an optional expiry date.

---

## Category 9: Developer APIs & Integrations

### 41. Mastodon REST API

- **Category**: Developer APIs & Integrations
- **Description**: Standardized REST API matching the Mastodon schema for managing accounts, posts, timelines, and relationships.
- **Sub-category / Actionable Details**: REST API Queries. Developers call HTTPS endpoints (e.g., `GET https://server.domain/api/v1/timelines/home`) with Bearer tokens to build clients.

### 42. Mastodon Streaming API

- **Category**: Developer APIs & Integrations
- **Description**: A WebSockets-based API that streams real-time updates and notification events to external clients.
- **Sub-category / Actionable Details**: Websocket Streaming connection. Open a connection to websocket URL `wss://server.domain/api/v1/streaming` and subscribe to streams (e.g. `user` or `public`).

### 43. Mastodon ActivityPub Protocol Endpoints

- **Category**: Developer APIs & Integrations
- **Description**: Core decentralized ActivityPub endpoints used to deliver and retrieve posts, likes, and follows across servers.
- **Sub-category / Actionable Details**: Federated Inbox Delivery. Developers target user inbox endpoints (e.g., `POST https://server.domain/users/username/inbox`) with signed HTTPS payloads.

### 44. Mastodon Webhook Subscriptions

- **Category**: Developer APIs & Integrations
- **Description**: Server-level webhook triggers that send JSON payloads to developer servers on events like status updates or reports.
- **Sub-category / Actionable Details**: Real-time System Webhooks. Set up under Admin Settings > Webhooks. Developers input target URLs, secret keys, and subscribe to events like `status.created` or `report.created`.

### 45. Mastodon App Registration Endpoint

- **Category**: Developer APIs & Integrations
- **Description**: API endpoint used by developers to register new client applications and retrieve OAuth credentials.
- **Sub-category / Actionable Details**: OAuth App Creation. Make an HTTP POST request to `/api/v1/apps` with body parameters `client_name`, `redirect_uris`, and `scopes` to receive a client ID and secret.

---

## Category 10: Account Settings & Authentication

### 46. Mastodon Two-Factor Authentication

- **Category**: Account Settings & Authentication
- **Description**: Secures your login credentials by requiring a TOTP security code from an authenticator app.
- **Sub-category / Actionable Details**: Login Protection. Go to Preferences > Account > Two-factor authentication, click "Enable," scan the QR code with your authenticator app, and enter a generated code to confirm.

### 47. Mastodon Account Alias Migration

- **Category**: Account Settings & Authentication
- **Description**: Sets up a redirect alias from an old account to a new one, displaying a redirect banner to followers.
- **Sub-category / Actionable Details**: Account Handover. Go to Preferences > Account > Account settings. Scroll to "Move to a different account," enter your new account's full handle, and submit.

### 48. Mastodon Profile Metadata Verification

- **Category**: Account Settings & Authentication
- **Description**: Verifies ownership of personal websites by searching for rel="me" backlink tags on target pages.
- **Sub-category / Actionable Details**: Profile Identity Verification. Paste your personal site link into a profile metadata field, and add the attribute `rel="me"` to the link on your site to trigger the verification.

### 49. Mastodon Authorized Applications

- **Category**: Account Settings & Authentication
- **Description**: Displays all third-party applications that have been granted access to your account details.
- **Sub-category / Actionable Details**: App Access Auditing. Go to Preferences > Authorized applications. Click the "Revoke" button next to any app to revoke its access tokens.

### 50. Mastodon Archive Export

- **Category**: Account Settings & Authentication
- **Description**: Generates and downloads a ZIP archive containing all account information, posts, and media in an ActivityPub-compliant format.
- **Sub-category / Actionable Details**: Backup Data Export. Go to Preferences > Import and export > Data export. Click "Request backup" and download the generated ZIP archive once compiled.
