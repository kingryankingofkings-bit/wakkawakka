# Kick Feature Research

This document compiles the feature research for Kick, categorized into the reconciled 10-category taxonomy. Each category contains exactly 5 unique, specific, and actionable features, totaling 50 features.

---

## Category 1: Content Creation & Editing

### 1. Kick Creator Dashboard Live Stream Management
- **Category**: Content Creation & Editing
- **Description**: The dedicated streaming management dashboard for Kick creators to change their current title, category, and tags before going live. It allows real-time edits to the broadcast's metadata to optimize search indexing and viewer attraction.
- **Sub-category / Actionable Details**: Stream Settings Editor. Open the Creator Dashboard, navigate to the "Stream Manager" tab, click "Edit Stream Info" on the quick actions panel, update fields, and click "Save."

### 2. Kick Broadcast Stream Key Generation
- **Category**: Content Creation & Editing
- **Description**: Generates unique RTMP stream URLs and secure stream keys required to connect external encoding software to Kick servers. These credentials must be kept confidential as they allow anyone to stream directly to the creator's channel.
- **Sub-category / Actionable Details**: Encoder Connection Credentials. Go to Creator Dashboard > Settings > Stream Key, click "Copy" next to the Stream URL and Stream Key fields, and paste them into the settings of your encoder software.

### 3. Kick Clips Creation Tool
- **Category**: Content Creation & Editing
- **Description**: Enables viewers and creators to capture and trim up to 60-second video segments from a live stream or past broadcast. These captured highlights are stored on the channel's profile page and can be easily shared across other social networks.
- **Sub-category / Actionable Details**: Ephemeral Video Trimmer. Click the clip icon (scissors) on the video player overlay, adjust the start and end sliders on the timeline popup, type a title, and click "Trim Clip."

### 4. Kick Creator Dashboard Broadcast Feed Preview
- **Category**: Content Creation & Editing
- **Description**: A low-latency video player inside the creator dashboard that displays the outgoing live video feed. It allows streamers to monitor their video quality, frame rates, and connection status in real-time.
- **Sub-category / Actionable Details**: Stream Feed Monitor. Access the Creator Dashboard and select "Stream Manager." Toggle the "Preview" block on the dashboard panel to view the live video broadcast.

### 5. Kick Chat Bot Integration Setup
- **Category**: Content Creation & Editing
- **Description**: Allows streamers to connect external moderators and bots to handle automated chat features and overlay graphics. It streamlines chat moderation and enhances community interaction through custom commands and loyalty points systems.
- **Sub-category / Actionable Details**: Automated Chat Utility. Navigate to your chat, type `/mod [botname]` (e.g., `/mod Botrix`), then open the bot's web platform and click "Link Kick Account" to authorize connection.

---

## Category 2: Content Discovery & Search

### 6. Kick Recommended Live Carousel
- **Category**: Content Discovery & Search
- **Description**: A prominent visual slider at the top of the Kick homepage showcasing featured live broadcasts across gaming, music, and creative arts. It helps users discover prominent creators who are currently streaming live on the platform.
- **Sub-category / Actionable Details**: Front Page Discovery. Navigate to `kick.com` on a web browser, and use the left and right navigation arrows on the banner to browse featured live streamers.

### 7. Kick Category Browse Directory
- **Category**: Content Discovery & Search
- **Description**: A catalog that displays all active live streams on the platform categorized by specific game titles or creative activities. It organizes broadcasts in descending order of current viewers to help users explore trending genres.
- **Sub-category / Actionable Details**: Main Directory Search. Click the "Browse" link at the top-left of the page, and select from subcategories like "Gaming," "IRL," "Music," or "Creative" to see active channels sorted by view count.

### 8. Kick Sub-Category Tag Filtering
- **Category**: Content Discovery & Search
- **Description**: Allows users to filter category feeds using specific descriptive labels such as language, genre, or stream style. It makes discovery much faster by filtering out irrelevant broadcasts and highlighting exact content matches.
- **Sub-category / Actionable Details**: Stream Filter Chips. Click on any game or category in the directory, and select one of the circular tags from the horizontal filter bar to narrow results.

### 9. Kick Followed Channels Sidebar
- **Category**: Content Discovery & Search
- **Description**: A collapsing left-hand sidebar on the desktop view that lists followed creators in order of their live status. It provides quick, one-click access to active streams that the user regularly watches.
- **Sub-category / Actionable Details**: Creator Tracking List. Navigate to any page on `kick.com`, view the sidebar on the left side of the screen, and click on any live creator’s avatar to load their stream.

### 10. Kick Live Search Auto-Suggest
- **Category**: Content Discovery & Search
- **Description**: A dynamic search bar that returns instant, auto-suggested listings for channels, games, and active categories. It updates recommendations as you type to speed up user navigation across the platform.
- **Sub-category / Actionable Details**: Search Query Autocomplete. Click the search bar at the top center of the desktop header, type in a search query, and select the corresponding channel or game card from the dropdown menu.

---

## Category 3: Interpersonal & Community Engagement

### 11. Kick Live Chat Window
- **Category**: Interpersonal & Community Engagement
- **Description**: A real-time chat interface displaying text messages, subscription alerts, and sub emotes next to the stream. It serves as the primary hub for immediate discussion and social interaction between the streamer and the audience.
- **Sub-category / Actionable Details**: Text Communication Interface. Located on the right side of the stream window on desktop, or in the bottom half on mobile. Type your comment in the text input area and press "Send."

### 12. Kick Channel Emote Selection
- **Category**: Interpersonal & Community Engagement
- **Description**: An interface that displays global Kick emotes and creator-specific custom emotes for subscribers to post in chat. It enables expressive visual communication and highlights subscriber status in public chat feeds.
- **Sub-category / Actionable Details**: Interactive Emote Picker. Click the smiling face icon in the bottom-right corner of the chat input box, scroll to select an emote, and click to insert it.

### 13. Kick Creator Raid Redirect
- **Category**: Interpersonal & Community Engagement
- **Description**: Allows streamers to send their entire active audience to another creator's live stream at the end of their broadcast. It fosters cross-channel networking and keeps viewers engaged within the platform's ecosystem.
- **Sub-category / Actionable Details**: Creator Raid Execution. Type `/raid [channel_name]` in the chat window or select the Raid option in the Quick Actions panel of the dashboard, wait for the timer, and click "Raid Now."

### 14. Kick Chat Polls Creator
- **Category**: Interpersonal & Community Engagement
- **Description**: A moderation tool that allows streamers and mods to launch real-time surveys in chat to collect votes. It provides an easy way to gather viewer feedback on gameplay choices or stream topics.
- **Sub-category / Actionable Details**: Audience Poll Command. Type `/poll new [question] | [option1] | [option2]` in chat, or use the interactive poll creator in the Creator Dashboard under Community tools.

### 15. Kick Loyalty Badge System
- **Category**: Interpersonal & Community Engagement
- **Description**: A customized badge asset system showing loyalty badges next to subscriber names in chat based on subscription age. Creators can design and upload unique badge graphics for different subscription milestones.
- **Sub-category / Actionable Details**: Loyalty Sub Badges. Managed in Creator Dashboard > Viewer Rewards > Badges. Creators upload custom icons for 1-month, 3-month, 6-month, and annual milestones.

---

## Category 4: Direct Messaging & Communication

### 16. Kick Chat Whispers
- **Category**: Direct Messaging & Communication
- **Description**: A direct, private messaging channel that allows users to send private text messages to other registered users. It enables one-on-one private chats away from public channel communication fields.
- **Sub-category / Actionable Details**: Private Text Messaging. Click the Whisper chat bubble icon in the top header menu, search for the user's display name, click "Start Chatting," and enter your message.

### 17. Kick Chat Username Mentions
- **Category**: Direct Messaging & Communication
- **Description**: An alert mechanism that draws a user's attention in chat by typing their username and highlighting the chat block. It highlights the target message block in yellow and triggers a browser notification if configured.
- **Sub-category / Actionable Details**: User Mention Highlights. Type `@` followed by the recipient's display username inside the channel chat input bar, and press enter to post the highlighted text.

### 18. Kick Whisper Mute Settings
- **Category**: Direct Messaging & Communication
- **Description**: Allows users to block or mute individual users from sending them direct messages or whispers on the platform. It helps protect users from harassment and filters out unsolicited chat conversations.
- **Sub-category / Actionable Details**: Direct Message Blocking. Open the Whisper window with the user, click the settings gear inside their specific chat box, and select "Mute User" or "Block User."

### 19. Kick Chat User Card Inspector
- **Category**: Direct Messaging & Communication
- **Description**: A clickable pop-up profile summary within chat that allows users to check account details. It displays quick actions like follow, block, report, and direct message shortcuts.
- **Sub-category / Actionable Details**: Interactive Profile Card. Click on any username in the channel chat list or chat stream to open their user card, and click the "Message" button to launch a private Whisper.

### 20. Kick Whisper Spam Filter
- **Category**: Direct Messaging & Communication
- **Description**: A security filter that blocks whispers from unknown users unless they are followed or friends. It protects the user's private inbox from automated bot spam and unsolicited messages.
- **Sub-category / Actionable Details**: Whisper Filtering. Go to Account Settings > Privacy & Safety, scroll to "Whisper Permissions," and select the checkbox "Only receive whispers from users I follow."

---

## Category 5: Monetization & E-Commerce

### 21. Kick Creator Subscriptions
- **Category**: Monetization & E-Commerce
- **Description**: A subscription plan costing $4.99 per month that provides creators with 95% of subscription revenue. It allows viewers to directly support creators while unlocking custom emotes and ad-free streaming.
- **Sub-category / Actionable Details**: Paid Channel Subscriptions. Click the green "Subscribe" button below the stream player, select Tier 1, and complete transaction details using Stripe or credit cards.

### 22. Kick Gifted Subscriptions
- **Category**: Monetization & E-Commerce
- **Description**: Allows viewers to buy channel subscriptions and distribute them to other chat participants. It is a key tool for community building and rewarding active chat participants.
- **Sub-category / Actionable Details**: Gifted Subscription Purchases. Click the "Gift a Sub" option inside the subscription popup, select "Gift to Community" or "Gift to specific user," choose the sub count, and complete checkout.

### 23. Kick Stripe Payout Integration
- **Category**: Monetization & E-Commerce
- **Description**: Creator portal integration that connects the creator's Kick account with Stripe to receive monthly payout earnings. It automates financial payouts and ensures secure processing of all digital transactions.
- **Sub-category / Actionable Details**: Creator Payment Setup. Navigate to Creator Dashboard > Revenue > Payment Method, click "Connect Stripe," fill out Stripe onboarding forms, and authorize payouts.

### 24. Kick Chat Message Pinning
- **Category**: Monetization & E-Commerce
- **Description**: A premium moderation tool that allows streamers or moderators to pin important text or sponsor links. Pinned messages remain fixed at the top of the chat panel for high visibility.
- **Sub-category / Actionable Details**: Chat Message Pinning. Hover over any chat message in the stream chat window, click the vertical three dots, and select "Pin Message" to display it in a fixed banner at the top of chat.

### 25. Kick Subscription Leaderboards
- **Category**: Monetization & E-Commerce
- **Description**: A leaderboard widget displayed in the chat header listing the top community subscription gifters in real-time. It encourages friendly competition among viewers and publicly recognizes top channel supporters.
- **Sub-category / Actionable Details**: Gifting Rankings. Displayed automatically in the chat panel header. Viewers can click the leaderboard icon to toggle the list showing the top three sub-gifters for the current broadcast.

---

## Category 6: Analytics, Business & Creator Tools

### 26. Kick Creator Dashboard Analytics Panel
- **Category**: Analytics, Business & Creator Tools
- **Description**: An analytics dashboard offering visual charts of viewer counts, follower conversion rates, and chat density. It helps creators evaluate their stream performance and identify growth trends.
- **Sub-category / Actionable Details**: Creator Analytics Suite. Navigate to Creator Dashboard > Analytics > Overview, and use the filter dropdowns to set custom timeframes for review.

### 27. Kick Creator Program Progress Dashboard
- **Category**: Analytics, Business & Creator Tools
- **Description**: A checklist tracker that monitors a streamer's metrics against the requirements for the Kick Creator Incentive Program. It displays real-time progress for hours streamed, active days, and unique viewers.
- **Sub-category / Actionable Details**: Achievement Trackers. Navigate to Creator Dashboard > Achievement or KCIP tab to view criteria status, including hours streamed and active days.

### 28. Kick Stream Sessions Log
- **Category**: Analytics, Business & Creator Tools
- **Description**: A historical log showing all past live stream sessions, total view hours, and peak concurrent viewers. It allows creators to review the analytics of individual broadcasts for scheduling optimization.
- **Sub-category / Actionable Details**: Historic Session Directory. Navigate to Creator Dashboard > Analytics > Streams, and click on individual stream dates to inspect performance summaries.

### 29. Kick Revenue Breakdown Dashboard
- **Category**: Analytics, Business & Creator Tools
- **Description**: An analytics widget detailing income sources, separating earnings between subscriptions, gifted subs, and ads. It provides creators with clear financial transparency and historical revenue data.
- **Sub-category / Actionable Details**: Financial Tracking Hub. Navigate to Creator Dashboard > Revenue > Earnings, where you can view charts detailing net earnings and monthly payouts.

### 30. Kick Moderator Action Audit Log
- **Category**: Analytics, Business & Creator Tools
- **Description**: A panel displaying a history of all moderation actions, such as user timeouts and message deletions, taken in chat. It helps streamers monitor moderator activity and maintain consistency in channel rules enforcement.
- **Sub-category / Actionable Details**: Mod Action Audit Logs. Open the Creator Dashboard, navigate to Settings > Moderator Logs, and filter by moderator name or action type.

---

## Category 7: Privacy, Security & Safety

### 31. Kick AutoMod Bad Word Filter
- **Category**: Privacy, Security & Safety
- **Description**: An automated filter that screens chat messages and blocks comments containing banned or blacklisted words. It intercepts toxic comments before they appear in public to maintain a healthy chat environment.
- **Sub-category / Actionable Details**: Keyword Filtering. Navigate to Creator Dashboard > Chat Settings > AutoMod, toggle "Enable AutoMod," and input custom words to block.

### 32. Kick Chat Slow Mode Control
- **Category**: Privacy, Security & Safety
- **Description**: Restricts chat message frequency, requiring users to wait a set number of seconds between messages. It helps moderators manage fast-moving chats and reduces comment spam during peak times.
- **Sub-category / Actionable Details**: Chat Rate Throttle. Type `/slow [seconds]` (e.g., `/slow 5`) in the chat window, or toggle "Slow Mode" inside the Creator Dashboard Chat Settings panel.

### 33. Kick Follower-Only Chat Mode
- **Category**: Privacy, Security & Safety
- **Description**: Restricts chat participation to users who have followed the channel for a designated duration. It prevents drive-by chat raids and encourages viewers to follow to participate in the conversation.
- **Sub-category / Actionable Details**: Exclusive Chat Access. Type `/followers [duration]` (e.g., `/followers 10m`) in chat, or select the Follower-Only toggle in the chat configuration menu.

### 34. Kick Banned Users Management List
- **Category**: Privacy, Security & Safety
- **Description**: A portal displaying all banned or timed-out users in a channel, with options to manage ban appeals. It gives creators and head moderators central control over the channel's moderation records.
- **Sub-category / Actionable Details**: Ban Management Console. Navigate to Creator Dashboard > Settings > Community > Banned Users, where you can search names or click "Unban" to restore chat rights.

### 35. Kick Email-Verified Chat Constraint
- **Category**: Privacy, Security & Safety
- **Description**: Prevents non-verified accounts from posting messages in chat, blocking automated spam accounts. It requires chatters to complete email verification before they can participate in live streams.
- **Sub-category / Actionable Details**: Verified Accounts Mode. Navigate to Creator Dashboard > Settings > Community > Chat Settings, and check the option "Require Email Verification."

---

## Category 8: Notifications & Time Management

### 36. Kick Creator Go-Live Push Notifications
- **Category**: Notifications & Time Management
- **Description**: Direct alerts dispatched to mobile devices when a followed streamer begins a live broadcast. It helps bring active followers back to the stream as soon as the creator goes live.
- **Sub-category / Actionable Details**: Go-Live Push Settings. Open a creator's profile page, click the "Follow" heart, and tap the bell icon to toggle push alerts.

### 37. Kick Creator Live Email Alerts
- **Category**: Notifications & Time Management
- **Description**: Automated email notifications containing the stream category, title, and live thumbnail sent to followers. It provides offline users with detailed stream information in their personal inboxes.
- **Sub-category / Actionable Details**: Email Alert Toggle. Go to Account Settings > Notifications, scroll to "Email Notifications," and toggle "Live Broadcasts" to on.

### 38. Kick Notification Snooze Control
- **Category**: Notifications & Time Management
- **Description**: An option to mute or snooze all push notifications from Kick for a designated time. It helps users manage interruptions during busy or quiet periods of their day.
- **Sub-category / Actionable Details**: Temporary Muting. Tap and hold a Kick push notification on your mobile screen, or access the mobile app settings to toggle notification snoozing for 1, 8, or 24 hours.

### 39. Kick Chat Scroll Freeze
- **Category**: Notifications & Time Management
- **Description**: Freezes chat scrolling when the user scrolls up, enabling them to read past comments. It stops auto-scrolling so moderators or users can read specific messages at their own pace.
- **Sub-category / Actionable Details**: Chat Navigation Lock. Scroll up inside the chat pane during a live broadcast to halt auto-scrolling, and click the "Resume Chat" arrow to return.

### 40. Kick VOD Auto-Publishing Toggle
- **Category**: Notifications & Time Management
- **Description**: Streamer setting that automatically saves and publishes live broadcasts as Video-On-Demand archives. It allows streamers to choose whether their streams are saved publicly or deleted immediately after ending.
- **Sub-category / Actionable Details**: VOD Archive Rules. Go to Creator Dashboard > Settings > Channel, and toggle "Store past broadcasts" to active to retain archives for 14 days.

---

## Category 9: Developer APIs & Integrations

### 41. Kick API Channel Status Endpoint
- **Category**: Developer APIs & Integrations
- **Description**: Programmatic JSON endpoint returning live status, viewer count, category details, and stream title for any channel. It allows developers to integrate real-time stream status indicators into external apps.
- **Sub-category / Actionable Details**: RESTful API Endpoint. Send an HTTP GET request to `https://kick.com/api/v1/channels/[channel_slug]` to fetch channel statistics, metadata, and follower counts in JSON format.

### 42. Kick Chat WebSocket Protocol
- **Category**: Developer APIs & Integrations
- **Description**: WebSocket service allowing developers to connect custom chat bots to read and send chat messages. It enables developers to handle real-time chat moderation and interactive games programmatically.
- **Sub-category / Actionable Details**: WebSocket Integration API. Open a WebSocket connection to Kick's Chat Server (using Pusher ws endpoints at `ws-us2.pusher.com`), subscribe to the channel `chatrooms.[id].v2`, and capture JSON chat event payloads.

### 43. Kick Third-Party Overlay API
- **Category**: Developer APIs & Integrations
- **Description**: API connectors allowing third-party tools to import and display Kick follower and subscription alerts. It lets developers and streamers create dynamic browser alerts for on-screen stream overlays.
- **Sub-category / Actionable Details**: Alert Overlay APIs. Access your StreamLabs dashboard, click "Add Platform," paste your Kick profile link to sync events, and copy the widget URL into your OBS browser source.

### 44. Kick OAuth 2.0 Authentication Service
- **Category**: Developer APIs & Integrations
- **Description**: Secure OAuth authorization framework that enables third-party apps to authenticate users using Kick login credentials. It secures user credentials while allowing authorized integrations to access account scopes.
- **Sub-category / Actionable Details**: Federated Identity API. Direct users to the Kick OAuth endpoint specifying `client_id`, `redirect_uri`, and required permission scopes to receive verification tokens.

### 45. Kick Webhook Events API
- **Category**: Developer APIs & Integrations
- **Description**: Programmatic webhook subscriptions pushing JSON payloads to developer servers for subscription or donation events. It removes the need for polling and alerts developers instantly when channel monetization events occur.
- **Sub-category / Actionable Details**: JSON Callback Webhooks. Configure webhook endpoints in the developer portal, register callback URLs, and write listener scripts to capture JSON POST data when new transactions occur.

---

## Category 10: Account Settings & Authentication

### 46. Kick Two-Factor Authentication
- **Category**: Account Settings & Authentication
- **Description**: Security configuration requiring a login verification code generated by an authenticator application. It adds an essential layer of security to prevent unauthorized access and protect streamer payout accounts.
- **Sub-category / Actionable Details**: Account Security Settings. Go to Account Settings > Security, click "Enable 2FA," scan the QR code with an authenticator app, and enter the generated verification code.

### 47. Kick Profile Customization Manager
- **Category**: Account Settings & Authentication
- **Description**: Settings panel allowing users to update display username, bio description, profile picture, and offline banner. It enables creators to refresh their channel branding and social links easily.
- **Sub-category / Actionable Details**: Profile Metadata Editor. Navigate to Account Settings > Profile, upload new image assets, edit the text fields, and click "Save Changes."

### 48. Kick Account Deletion Request System
- **Category**: Account Settings & Authentication
- **Description**: A self-service tool that initiates account deletion, permanently purging account details and files. It enforces data privacy compliance by removing all personal records after a confirmation cooldown.
- **Sub-category / Actionable Details**: Data Purging Console. Navigate to Account Settings > Account, click the "Delete Account" button, confirm your request, and click the confirmation link sent to your registered email address.

### 49. Kick Password Reset Portal
- **Category**: Account Settings & Authentication
- **Description**: Account recovery system sending password reset links to registered email addresses. It allows users to regain access to their accounts securely if they forget their password.
- **Sub-category / Actionable Details**: Credential Recovery. Click "Forgot Password" on the Kick login page, enter your email address, open the verification link received, and submit a new secure password.

### 50. Kick Account Security Audit Log
- **Category**: Account Settings & Authentication
- **Description**: Displays security data including login device types, IP addresses, dates, and locations. It helps users audit login history and terminate sessions on unrecognized devices.
- **Sub-category / Actionable Details**: Active Sessions Log. Open Account Settings > Security, inspect the list of active sessions, and click "Revoke Session" or "Log Out from All Devices."
