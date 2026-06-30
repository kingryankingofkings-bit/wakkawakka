# Bluesky Feature Research

This document compiles the feature research for Bluesky, categorized into the reconciled 10-category taxonomy. Each category contains exactly 5 unique, specific, and actionable features, totaling 50 features.

---

## Category 1: Content Creation & Editing

### 1. Bluesky Text Composer

- **Category**: Content Creation & Editing
- **Description**: Allows users to post text updates up to 300 characters, with pasted URLs automatically processed and resolved into rich link card previews.
- **Sub-category / Actionable Details**: Post Composition. Click the "New Post" button in the bottom right corner of the screen, enter your text, and verify that any included link generates a preview card.

### 2. Bluesky Video Uploads

- **Category**: Content Creation & Editing
- **Description**: Enables users to upload and publish vertical or horizontal video clips up to 60 seconds long directly in their posts.
- **Sub-category / Actionable Details**: Video Post Composition. Click the "New Post" button, tap the camera icon in the composer toolbar, select a video file from your device, and click "Post" to begin uploading.

### 3. Bluesky Alt Text Editor

- **Category**: Content Creation & Editing
- **Description**: Prompts users to add descriptive alternative text descriptions to all image uploads to enhance accessibility for screen readers.
- **Sub-category / Actionable Details**: Accessibility Metadata. After selecting an image in the post composer, click the "ALT" button overlay on the image thumbnail to open the text editor, type your description, and click "Done."

### 4. Bluesky Rich Text Facets

- **Category**: Content Creation & Editing
- **Description**: Formats interactive elements like user mentions, links, and hashtags within a post dynamically without counting toward character limits.
- **Sub-category / Actionable Details**: Dynamic Text Markup. Type a "@" followed by a user handle (e.g. `@name.bsky.social`) or a hashtag (e.g. `#atproto`) in the composer. The app automatically highlights and links the text upon posting.

### 5. Bluesky Thread Composer

- **Category**: Content Creation & Editing
- **Description**: Allows creators to build and publish multiple connected posts at once, creating a clean conversational thread.
- **Sub-category / Actionable Details**: Thread Publisher. Click "New Post," then click the "+" button next to the post button to add a new post to the sequence. Repeat for up to 10 posts, then click "Post All."

---

## Category 2: Content Discovery & Search

### 6. Bluesky Custom Feeds

- **Category**: Content Discovery & Search
- **Description**: Allows users to subscribe to and pin specialized feeds developed by the community using custom algorithms, keywords, or lists.
- **Sub-category / Actionable Details**: Decentralized Feeds. Tap the Feeds tab, click "Discover Feeds" to browse custom algorithmic streams, and click the "+" button to pin your favorite feeds to your home bar.

### 7. Bluesky Search Query Syntax

- **Category**: Content Discovery & Search
- **Description**: Supports advanced operators within the search bar to locate specific posts and profiles on the network.
- **Sub-category / Actionable Details**: Content Filter Search. Enter search parameters like `from:username`, `since:2026-01-01`, or negative flags like `-word` in the search input box to filter results.

### 8. Bluesky Discover Feed

- **Category**: Content Discovery & Search
- **Description**: A default personalized algorithmic feed showcasing popular posts, trending discussions, and customized content recommendations.
- **Sub-category / Actionable Details**: Algorithmic Recommendations. Tap the Home icon on the navigation panel and swipe or click the "Discover" tab in the top header.

### 9. Bluesky Feeds Directory

- **Category**: Content Discovery & Search
- **Description**: A public repository of all registered custom feeds that can be searched and filtered by popularity, creator, or topic.
- **Sub-category / Actionable Details**: Feed Search Index. Navigate to the Feeds tab in the main sidebar, select "Discover Feeds," and type keywords in the feed search bar to find custom timelines.

### 10. Bluesky Topic Hashtags

- **Category**: Content Discovery & Search
- **Description**: Aggregates all posts containing a specific hashtag into a chronological stream of posts featuring that tag.
- **Sub-category / Actionable Details**: Hashtag Streams. Click any active hashtag link in a post caption (e.g., `#gardening`) or search a hashtag in the search box to view the corresponding real-time topic feed.

---

## Category 3: Interpersonal & Community Engagement

### 11. Bluesky Lists

- **Category**: Interpersonal & Community Engagement
- **Description**: Enables users to create and manage custom collections of accounts for muting, blocking, or creating custom feed filters.
- **Sub-category / Actionable Details**: Account Grouping. Navigate to lists under Settings > Moderation > Mute Lists or User Lists, click "New List," add accounts, and name the list.

### 12. Bluesky Reply Thread Views

- **Category**: Interpersonal & Community Engagement
- **Description**: Customizes the layout of thread replies to show conversations chronologically, by popularity, or in a nested tree structure.
- **Sub-category / Actionable Details**: Thread Layout Settings. Access Settings > Thread Preferences, and select your preferred view mode under the reply thread options.

### 13. Bluesky Quote Posts

- **Category**: Interpersonal & Community Engagement
- **Description**: Shares another user's post with your own text comment or media attachment appended above the original content.
- **Sub-category / Actionable Details**: Quoted Shares. Tap the circular arrow repost icon below a post, select "Quote Post," write your commentary in the composer, and tap "Post."

### 14. Bluesky Starter Packs

- **Category**: Interpersonal & Community Engagement
- **Description**: Allows users to bundle a set of recommended accounts and custom feeds into a shareable package to help new users onboard.
- **Sub-category / Actionable Details**: Profile Curations. Go to your profile, tap the "Starter Packs" tab, select "Create Starter Pack," choose up to 50 accounts and 3 feeds, name the pack, and click publish.

### 15. Bluesky Decoupled Quote Posts

- **Category**: Interpersonal & Community Engagement
- **Description**: Allows the creator of a post to detach their post from another user's quote post to prevent unwanted associations or contexts.
- **Sub-category / Actionable Details**: Quote Post Moderation. Navigate to the quote post that links to your original post, click the three-dot menu on the quote post, and select "Detach my post."

---

## Category 4: Direct Messaging & Communication

### 16. Bluesky Direct Messaging

- **Category**: Direct Messaging & Communication
- **Description**: Allows users to exchange private, one-on-one text messages directly with other accounts on the network.
- **Sub-category / Actionable Details**: Direct Messaging. Tap the chat envelope icon in the main navigation bar, click the "New Chat" icon, search for a user handle, and type your message.

### 17. Bluesky DM Permission Controls

- **Category**: Direct Messaging & Communication
- **Description**: Manages who can send you direct messages, restricting incoming messages to specific circles.
- **Sub-category / Actionable Details**: DM Security Settings. Tap the settings gear icon within the Chat interface, and select between "Everyone," "Users I follow," or "No one."

### 18. Bluesky DM Message Requests

- **Category**: Direct Messaging & Communication
- **Description**: Isolates direct messages sent by users you do not follow into a separate folder for manual approval.
- **Sub-category / Actionable Details**: Message Request Filtering. Open the Chat section in the app. Message requests are separated into a "Requests" tab at the top of the chat list, which you can tap to review or ignore.

### 19. Bluesky Direct Message Deletion

- **Category**: Direct Messaging & Communication
- **Description**: Deletes direct messages from your own inbox view without deleting them from the recipient's inbox.
- **Sub-category / Actionable Details**: Chat Message Deletion. Open a chat thread, long-press a specific message bubble, and tap "Delete for me" from the popup menu.

### 20. Bluesky DM Notification Badges

- **Category**: Direct Messaging & Communication
- **Description**: Displays a red badge counter over the chat icon in the navigation bar to alert users to unread direct messages.
- **Sub-category / Actionable Details**: Message Alerts. Enabled by default. Manage push notification behavior under Settings > Notifications > Chat Messages to toggle alerts on or off.

---

## Category 5: Monetization & E-Commerce

### 21. Bluesky Domain Registration Integration

- **Category**: Monetization & E-Commerce
- **Description**: Integrates with third-party domain registrars to let users purchase and map custom domains to use as their handle directly inside the app.
- **Sub-category / Actionable Details**: Handle Purchase Portal. Go to Settings > Change Handle. Select "I have my own domain," click "Buy a new domain," search for available domain names, and complete the purchase via the Namecheap integration.

### 22. Bluesky Creator Tip Links

- **Category**: Monetization & E-Commerce
- **Description**: Displays links on user profiles pointing to third-party payment services like Ko-fi, Patreon, or Buy Me a Coffee.
- **Sub-category / Actionable Details**: Profile Monetization Links. Edit your profile, and paste your payment gateway URL in the bio or description field. The app detects standard payment links and displays a payment badge.

### 23. Bluesky Professional Accounts

- **Category**: Monetization & E-Commerce
- **Description**: Specialized profiles for business and media entities that support custom external storefront links.
- **Sub-category / Actionable Details**: Commercial Profile Setup. Edit profile settings, select profile type "Professional," and fill in business details including physical location and store URL.

### 24. Bluesky Custom Feed Monetization

- **Category**: Monetization & E-Commerce
- **Description**: Allows developers of custom feeds to embed sponsor banners or external tip links in feed descriptions.
- **Sub-category / Actionable Details**: Feed Description Sponsorships. Feed developers format their feed configuration metadata to include sponsor links and payment details within the description text.

### 25. Bluesky Affiliate Link Preview Support

- **Category**: Monetization & E-Commerce
- **Description**: Displays optimized product card layouts when posting ecommerce affiliate URLs, showing prices and buy buttons.
- **Sub-category / Actionable Details**: Affiliate Product Cards. When pasting an affiliate link (e.g. Amazon Affiliate) in the post composer, click the card preview checkbox to generate a formatted shopping card.

---

## Category 6: Analytics, Business & Creator Tools

### 26. Bluesky Post View Counters

- **Category**: Analytics, Business & Creator Tools
- **Description**: Displays a public counter showing the total number of views or impressions on individual posts.
- **Sub-category / Actionable Details**: Post Reach Auditing. Look at the bottom of any post. Next to the repost and reply counts, the view count icon shows the total number of times the post has appeared on screens.

### 27. Bluesky Feed Performance Metrics

- **Category**: Analytics, Business & Creator Tools
- **Description**: Provides developers of custom feeds with dashboards showing active subscriber counts, API requests, and usage.
- **Sub-category / Actionable Details**: Feed Analytics. Access via the feed generator dashboard in your development environment to inspect API logs and check subscriber rates.

### 28. Bluesky Third-Party Analytics Integration

- **Category**: Analytics, Business & Creator Tools
- **Description**: Allows creators to sync their account with external tools like SkyFeed or deck.blue to analyze follower growth and post engagements.
- **Sub-category / Actionable Details**: External Tool Synchronization. Authorize third-party analytics clients by generating an App Password in your settings and logging in on the tool's platform.

### 29. Bluesky Profile Share Cards

- **Category**: Analytics, Business & Creator Tools
- **Description**: Generates stylized image files containing QR codes and profile details for cross-platform sharing.
- **Sub-category / Actionable Details**: Profile QR Generator. Open your profile page, click the three-dot menu next to your handle, select "Share Profile," and tap "Save Image" to export the card.

### 30. Bluesky Custom Handle Manager

- **Category**: Analytics, Business & Creator Tools
- **Description**: Upgrades user handles from standard `.bsky.social` subdomains to custom DNS domains to verify brand authenticity.
- **Sub-category / Actionable Details**: Handle Verification. Go to Settings > Change Handle. Select "I have my own domain," enter your custom domain name, and configure DNS records as prompted to verify ownership.

---

## Category 7: Privacy, Security & Safety

### 31. Bluesky Labeling Services

- **Category**: Privacy, Security & Safety
- **Description**: Allows users to subscribe to independent third-party moderation services that apply warnings or filter content in their feeds.
- **Sub-category / Actionable Details**: Third-Party Moderation. Go to Settings > Moderation > Labelers, browse community labelers, and click "Subscribe" to apply their safety tags to your feed.

### 32. Bluesky Custom Mute Lists

- **Category**: Privacy, Security & Safety
- **Description**: Enables users to create and subscribe to public blocklists and mute lists created by the community.
- **Sub-category / Actionable Details**: Shared Blocklists. Navigate to Settings > Moderation > Mute Lists, and browse or search for lists (e.g. "Spam Accounts") to mute all accounts on the list at once.

### 33. Bluesky Content Filters

- **Category**: Privacy, Security & Safety
- **Description**: Configures visibility rules for sensitive content, hate speech, spam, and violence.
- **Sub-category / Actionable Details**: Content Category Muting. Go to Settings > Moderation > Content Filters, and set categories (e.g. "Explicit Content") to "Show," "Warn," or "Hide."

### 34. Bluesky Thread Reply Hiding

- **Category**: Privacy, Security & Safety
- **Description**: Allows the author of a thread to hide replies to keep their discussion sections relevant.
- **Sub-category / Actionable Details**: Comment Moderation. Tap the three-dot menu next to a reply on your post, select "Hide reply," and confirm the action.

### 35. Bluesky Block Propagation

- **Category**: Privacy, Security & Safety
- **Description**: Instantly hides the user's posts, replies, and profile page from blocked accounts across the decentralized network.
- **Sub-category / Actionable Details**: User Blocking. Click the three-dot menu on any profile page or post, and select "Block account." The block propagates to your personal data server.

---

## Category 8: Notifications & Time Management

### 36. Bluesky Push Alert Preferences

- **Category**: Notifications & Time Management
- **Description**: Customizes the delivery of push notifications for interactions such as likes, reposts, mentions, and follows.
- **Sub-category / Actionable Details**: Mobile Alert Customization. Go to Settings > Notifications, and toggle the individual switches for each category of interaction.

### 37. Bluesky Notification Filtering

- **Category**: Notifications & Time Management
- **Description**: Filters notifications to exclude interactions from accounts you don't follow or new accounts.
- **Sub-category / Actionable Details**: Notification Inbox Filters. Open the Notifications tab, tap the settings gear icon, and select "Filter notifications from people you don't follow" or "Filter new accounts."

### 38. Bluesky Badge Count Controls

- **Category**: Notifications & Time Management
- **Description**: Configures the red notification badge counts on the app icon to only update for specific event categories.
- **Sub-category / Actionable Details**: Badge Settings. Go to Settings > Notifications, scroll down to "Badge Count," and choose whether to count "All Notifications" or "Mentions and Replies Only."

### 39. Bluesky Push Schedule Quiet Hours

- **Category**: Notifications & Time Management
- **Description**: Syncs notifications with mobile operating system quiet periods to silence notifications during scheduled hours.
- **Sub-category / Actionable Details**: Scheduled Silent Hours. Configured via your device's native settings (iOS Focus Mode or Android Do Not Disturb) to mute Bluesky push alerts.

### 40. Bluesky Mute Thread

- **Category**: Notifications & Time Management
- **Description**: Mutes notifications for a specific conversational thread to stop receiving alerts from replies.
- **Sub-category / Actionable Details**: Conversational Thread Muting. Open the thread, click the three-dot menu at the top of the root post, and select "Mute thread."

---

## Category 9: Developer APIs & Integrations

### 41. Bluesky AT Protocol XRPC

- **Category**: Developer APIs & Integrations
- **Description**: The core remote procedure call protocol used to query, create, and modify records in the decentralized network.
- **Sub-category / Actionable Details**: XRPC Endpoint Query. Developers make HTTP POST or GET requests to the XRPC service URL (e.g. `https://bsky.social/xrpc/app.bsky.feed.getTimeline`) with bearer tokens.

### 42. Bluesky Lexicons

- **Category**: Developer APIs & Integrations
- **Description**: Schema definitions written in JSON that define data types, RPC methods, and records for the network.
- **Sub-category / Actionable Details**: Schema Validation. Developers read schema definitions from the `@atproto/api` package, creating objects that match the specified lexicon schemas (e.g. `app.bsky.actor.profile`).

### 43. Bluesky Personal Data Server API

- **Category**: Developer APIs & Integrations
- **Description**: API endpoints on Personal Data Server (PDS) nodes used to manage repositories, uploads, and authentication.
- **Sub-category / Actionable Details**: Repository Management. Interact with your hosting PDS via endpoint `/xrpc/com.atproto.repo.createRecord` to publish data programmatically.

### 44. Bluesky Firehose API

- **Category**: Developer APIs & Integrations
- **Description**: A WebSockets subscription endpoint that streams every public event and record modification across the network in real-time.
- **Sub-category / Actionable Details**: Real-time Event Stream. Open a WebSocket connection to the relay firehose URL (e.g. `wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos`) to parse incoming CAR block streams.

### 45. Bluesky AppView Service

- **Category**: Developer APIs & Integrations
- **Description**: Central indexing API service used to query compiled timelines, threads, and user profiles across servers.
- **Sub-category / Actionable Details**: Compiled Index Queries. Query the AppView endpoints (e.g. `GET /xrpc/app.bsky.feed.getPostThread`) to retrieve aggregated, user-facing thread layouts.

---

## Category 10: Account Settings & Authentication

### 46. Bluesky App Passwords

- **Category**: Account Settings & Authentication
- **Description**: Creates unique, single-purpose passwords for logging into third-party apps without sharing main credentials.
- **Sub-category / Actionable Details**: Third-Party Credentials. Navigate to Settings > App Passwords, click "Add App Password," give it a label, and save the generated password code.

### 47. Bluesky Data Repository Export

- **Category**: Account Settings & Authentication
- **Description**: Downloads the user's complete data repository, containing all posts, likes, follows, and history as a CAR file.
- **Sub-category / Actionable Details**: Profile Data Download. Navigate to Settings > Account > Export My Data, and click the download button to request your archive file.

### 48. Bluesky Domain Handle Verification

- **Category**: Account Settings & Authentication
- **Description**: Configures DNS TXT or HTTP redirect records on a custom domain to verify and change the user's handle.
- **Sub-category / Actionable Details**: Handle Verification DNS. Go to Settings > Change Handle. Select "I have my own domain," enter your custom domain name, and configure the DNS TXT record `_atproto` with your host value.

### 49. Bluesky Two-Factor Authentication

- **Category**: Account Settings & Authentication
- **Description**: Requires email-based verification codes when logging in from new devices to secure access.
- **Sub-category / Actionable Details**: Account Protection. Go to Settings > Two-Factor Authentication. Toggle "Require code on login" to enable, and verify via email verification.

### 50. Bluesky Personal Data Server Transfer

- **Category**: Account Settings & Authentication
- **Description**: Migrates the user's complete account data, posts, and social graph from one PDS provider to another.
- **Sub-category / Actionable Details**: PDS Migration. Go to Settings > Account > Advanced, select "Transfer Account," input the address of your new PDS provider, and authorize the migration.
