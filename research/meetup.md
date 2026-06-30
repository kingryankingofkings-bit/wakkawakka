# Meetup Feature Research

This document compiles the feature research for Meetup, categorized into the reconciled 10-category taxonomy. Each category contains exactly 5 unique, specific, and actionable features, totaling 50 features.

---

## Category 1: Content Creation & Editing

### 1. Meetup Event Scheduler
- **Category**: Content Creation & Editing
- **Description**: Allows group organizers to create and schedule physical or virtual events, specifying the date, time, location, and event details.
- **Sub-category / Actionable Details**: Event Creation. Accessed by navigating to the group page, clicking "Create Event," entering the event title, date, time, selecting physical address or Zoom/virtual link, and saving.

### 2. Recurring Event Template
- **Category**: Content Creation & Editing
- **Description**: Permits organizers to configure repeat schedules for events that happen on a regular basis (e.g., weekly or monthly) without recreating them.
- **Sub-category / Actionable Details**: Scheduled Reoccurrence. Within the event scheduler, toggle the "Repeat this event" option, select the frequency (e.g., "Every 2 weeks"), and specify the end date.

### 3. Draft Event Save
- **Category**: Content Creation & Editing
- **Description**: Enables organizers to save an in-progress event configuration as a draft, allowing them to resume editing and publish later.
- **Sub-category / Actionable Details**: Work-in-Progress Storage. In the event creation wizard, click "Save as draft" in the footer menu to save parameters and exit. The draft is retrievable from the "Drafts" tab on the organizer's group dashboard.

### 4. Event Custom Image Crop & Upload
- **Category**: Content Creation & Editing
- **Description**: Allows organizers to upload custom banner images for events and crop them to fit the standard Meetup display dimensions.
- **Sub-category / Actionable Details**: Media Formatting. During event setup, click "Add event photo," select a JPG or PNG file from local storage, drag the crop boundaries to select the visible area, and click "Save."

### 5. Group About Page Editor
- **Category**: Content Creation & Editing
- **Description**: A rich text editor for describing the Meetup group's purpose, rules, history, and target member demographic.
- **Sub-category / Actionable Details**: Page Personalization. Navigate to Group Settings > Group profile > About section, and use the formatting toolbar to input text, bold headings, list bullet points, and insert hyperlinks.

---

## Category 2: Content Discovery & Search

### 6. Map-Based Event Search
- **Category**: Content Discovery & Search
- **Description**: Displays upcoming local Meetup events on an interactive map, allowing users to discover communities by physical proximity.
- **Sub-category / Actionable Details**: Geographic Exploration. From the search homepage, toggle the "Map view" icon, adjust the map zoom level, and click on individual event pin-drops to view pop-up details and RSVP options.

### 7. Interest-Based Personalization Engine
- **Category**: Content Discovery & Search
- **Description**: Recommends groups and events based on interests selected by the user during onboarding or updated in their profile settings.
- **Sub-category / Actionable Details**: Algorithmic Recommendations. During account creation or via Settings > Interests, select topics (e.g., "Outdoors," "Board Games"). The homepage feed will automatically prioritize groups matching these tags.

### 8. Calendar Integration & Feed Export
- **Category**: Content Discovery & Search
- **Description**: Generates a personalized calendar feed URL containing the user's upcoming Meetups, compatible with external calendars like Google Calendar or Apple Calendar.
- **Sub-category / Actionable Details**: Calendar Syncing. Navigate to Profile Settings > Connections, click "Export Calendar Feed," copy the generated iCal link, and paste it into the "Add calendar by URL" field in your external calendar app.

### 9. Keyword Search with Radius Filters
- **Category**: Content Discovery & Search
- **Description**: Allows users to input search terms and filter results by distance radius from a specific zip code or city.
- **Sub-category / Actionable Details**: Distance Filtering. Type a query (e.g., "React Development") into the search bar, click "Filters," select the distance dropdown (ranging from 2 miles to 100 miles), and click "Apply."

### 10. Find a Group/Event Category Browser
- **Category**: Content Discovery & Search
- **Description**: A structured directory classifying Meetup groups into specific top-level categories (e.g., Tech, Writing, Fitness) for guided browsing.
- **Sub-category / Actionable Details**: Category Navigation. Click the "Explore" button on the main navigation bar, select a category card, and browse the curated list of groups and events sorted by relevance and popularity.

---

## Category 3: Interpersonal & Community Engagement

### 11. Event RSVP List
- **Category**: Interpersonal & Community Engagement
- **Description**: Displays the names and profiles of members who have RSVP'd to an event, including waitlist status and guests.
- **Sub-category / Actionable Details**: Attendance Transparency. Open any event page, scroll to the "Attendees" section, and click "See all" to view the list of confirmed attendees, guests count, and waitlisted members.

### 12. Meetup Group Discussions & Comments
- **Category**: Interpersonal & Community Engagement
- **Description**: Threaded message boards on group and event pages that allow members to post questions, share resources, and interact before and after events.
- **Sub-category / Actionable Details**: Community Boards. Go to the group's home page, select the "Discussions" tab, type a comment in the text field, and tap "Post." Users can reply directly to specific posts to start threads.

### 13. Organizer Roles & Permissions Delegation
- **Category**: Interpersonal & Community Engagement
- **Description**: Enables the primary group organizer to assign co-organizer, assistant organizer, or event host roles to trusted members.
- **Sub-category / Actionable Details**: Leadership Delegation. Go to Group Settings > Members, search for a member's name, click the three-dot menu next to their profile, select "Change role," choose the new role, and save.

### 14. Event Attendance Tracker
- **Category**: Interpersonal & Community Engagement
- **Description**: Provides organizers with a tool to mark members as present, absent, or no-shows during or after an event.
- **Sub-category / Actionable Details**: Roll Call Tool. Open the event page in the organizer app, select "Manage attendees," toggle the checkmarks next to each attendee's name to record their physical presence, and click "Submit."

### 15. Group Photo Album Contributions
- **Category**: Interpersonal & Community Engagement
- **Description**: Allows members and organizers to upload photos taken during Meetup events to a shared, group-specific photo album.
- **Sub-category / Actionable Details**: Visual Archives. Navigate to a past event page, scroll to the photos section, click "Upload photo," select images from the device gallery, and confirm upload to make them visible to all group members.

---

## Category 4: Direct Messaging & Communication

### 16. Contact Organizer Tool
- **Category**: Direct Messaging & Communication
- **Description**: Provides a direct messaging link on the group homepage, allowing prospective or current members to ask organizers private questions.
- **Sub-category / Actionable Details**: Group Leader Contact. Click the "Contact Organizer" button located on the sidebar of the group's homepage, type a message in the text window, and click "Send message."

### 17. Group-Wide Organizer Announcements
- **Category**: Direct Messaging & Communication
- **Description**: Allows organizers to broadcast emails and push notifications containing important updates to all registered group members simultaneously.
- **Sub-category / Actionable Details**: Broadcast Messaging. Go to Organizer Tools > Email members, write the message subject and body, check "Send to all members," and click "Send announcement."

### 18. Direct Message Chat Rooms
- **Category**: Direct Messaging & Communication
- **Description**: Private, one-on-one text-based chat rooms that allow members to converse directly and build individual connections.
- **Sub-category / Actionable Details**: Private Messaging. Tap the speech bubble icon in the header, click "New Chat," search for a member's name, type a message in the chat box, and press enter.

### 19. Event Discussion Chat
- **Category**: Direct Messaging & Communication
- **Description**: A dedicated chat room specific to a single event that automatically includes all members who have RSVP'd.
- **Sub-category / Actionable Details**: Event-Specific Communication. Open an upcoming event page, click "Join Event Chat," and send text messages or coordinate logistics with other attendees.

### 20. Member Profile Message Block
- **Category**: Direct Messaging & Communication
- **Description**: Allows users to restrict who can initiate direct message conversations with them to prevent spam or unwanted outreach.
- **Sub-category / Actionable Details**: Message Privacy. Navigate to Settings > Privacy, scroll to the "Direct Messages" section, select "Only members of my groups" or "Nobody," and save changes.

---

## Category 5: Monetization & E-Commerce

### 21. Ticketed Events (Event Fee Collections)
- **Category**: Monetization & E-Commerce
- **Description**: Enables organizers to charge a fee to attend specific events, requiring payment during the RSVP process.
- **Sub-category / Actionable Details**: Event Ticketing. When creating an event, toggle "Charge a fee" to active, enter the price, select the accepted payment method, choose a refund policy, and save.

### 22. Group Member Dues
- **Category**: Monetization & E-Commerce
- **Description**: Allows organizers to require members to pay a recurring subscription fee (monthly or annually) to maintain active membership in the group.
- **Sub-category / Actionable Details**: Recurring Subscriptions. Navigate to Group Settings > Member dues, click "Set up dues," enter the price and billing frequency, specify a trial period if desired, and link a Stripe account.

### 23. Sponsorship Banner Placements
- **Category**: Monetization & E-Commerce
- **Description**: Enables organizers to feature local businesses or sponsors on their group's homepage and event pages.
- **Sub-category / Actionable Details**: Sponsored Placements. Go to Group Settings > Sponsors, click "Add sponsor," enter the sponsor's name, upload their logo banner, paste their website URL, and save.

### 24. Stripe Integration for Organizers
- **Category**: Monetization & E-Commerce
- **Description**: Connects an organizer's Meetup account with Stripe to process event fees and membership dues securely, depositing funds directly into their bank account.
- **Sub-category / Actionable Details**: Payment Processing Gateway. Go to Payment Settings, click "Connect with Stripe," enter your business or personal details on the Stripe authorization screen, and return to Meetup.

### 25. Organizer Subscription Billing
- **Category**: Monetization & E-Commerce
- **Description**: Meetup's native billing system that charges organizers a monthly or semi-annual subscription fee to host groups on the platform.
- **Sub-category / Actionable Details**: Platform Hosting Subscriptions. Go to Settings > Subscription, select the preferred hosting plan (e.g., standard or pro), enter credit card details, and click "Activate."

---

## Category 6: Analytics, Business & Creator Tools

### 26. Group Growth Analytics Dashboard
- **Category**: Analytics, Business & Creator Tools
- **Description**: Displays charts tracking total member counts, growth rates, and page view metrics over selectable time periods.
- **Sub-category / Actionable Details**: Community Growth Tracking. Navigate to Organizer tools > Analytics to view visual charts illustrating cumulative member growth, new joins, and page visits.

### 27. RSVP Conversion Metrics
- **Category**: Analytics, Business & Creator Tools
- **Description**: Tracks the ratio of unique page views to confirmed RSVPs for individual events, helping organizers evaluate their event marketing.
- **Sub-category / Actionable Details**: Performance Analytics. Open Event Tools > Traffic, and analyze the metrics displaying total page impressions alongside total click-through RSVPs.

### 28. Member Survey Tool
- **Category**: Analytics, Business & Creator Tools
- **Description**: Allows organizers to publish simple polls to members to gather feedback on event locations, times, or topics.
- **Sub-category / Actionable Details**: Member Polling. Under the group's Discussion page, click "Create Poll," enter a question, add up to 5 response options, select the duration, and click "Post."

### 29. Attendance History Reports
- **Category**: Analytics, Business & Creator Tools
- **Description**: Generates and downloads historical records of event attendance, including member details and no-show statuses, as a CSV file.
- **Sub-category / Actionable Details**: Data Exporting. Navigate to Organizer tools > Reports > Attendance, select the date range of past events, and click "Download CSV."

### 30. Group Promo Codes
- **Category**: Analytics, Business & Creator Tools
- **Description**: Permits organizers to create discount or promotional code strings that members can apply to bypass or reduce ticketed event fees.
- **Sub-category / Actionable Details**: Discount Codes. Go to Event settings > Pricing > Promo Codes, click "Add Code," enter the code string, select the discount percentage or fixed amount, and click "Save."

---

## Category 7: Privacy, Security & Safety

### 31. Private Group Settings
- **Category**: Privacy, Security & Safety
- **Description**: Restricts visibility of the group's event details, location pins, and member list to approved group members only.
- **Sub-category / Actionable Details**: Privacy Configuration. Go to Group settings > Privacy settings, and select "Private group" to hide details from public web searches and non-members.

### 32. Member Approval Queue
- **Category**: Privacy, Security & Safety
- **Description**: Requires new members to answer onboarding questions and obtain organizer approval before gaining access to a private group.
- **Sub-category / Actionable Details**: Membership Gatekeeping. Under Group Settings, enable "Approval required," click "Set questions," write up to three custom entry questions, and review applicant answers in the pending queue.

### 33. Report Member/Group Tool
- **Category**: Privacy, Security & Safety
- **Description**: Allows users to flag individual profiles, event pages, or entire groups that violate Meetup's community guidelines or terms of service.
- **Sub-category / Actionable Details**: Abuse Reporting. Tap the flag or three-dot icon on any profile, event description, or group page, select the violation reason (e.g., spam, safety concerns), and click "Submit report."

### 34. Block Member Action
- **Category**: Privacy, Security & Safety
- **Description**: Prevents a blocked user from sending direct messages to you, viewing your profile, or joining any group where you are the primary organizer.
- **Sub-category / Actionable Details**: Member Blocking. Open the target user's profile, click the three-dot menu, select "Block member," and click "Confirm."

### 35. Event Host Moderation Tools
- **Category**: Privacy, Security & Safety
- **Description**: Gives designated event hosts the authority to remove members from an event RSVP list or ban them from the group during or after an event.
- **Sub-category / Actionable Details**: RSVP Moderation. Navigate to the event's attendee list, find the disruptive member, click the three dots next to their name, and select "Remove RSVP" or "Ban from group."

---

## Category 8: Developer APIs & Integrations

### 36. Meetup REST API
- **Category**: Developer APIs & Integrations
- **Description**: A developer API that provides RESTful endpoints to query public groups, events, locations, and member counts.
- **Sub-category / Actionable Details**: API Data Retrieval. Access `api.meetup.com`, authenticate with developer API keys or OAuth, and make HTTP requests to fetch event JSON data.

### 37. OAuth 2.0 Identity Login
- **Category**: Developer APIs & Integrations
- **Description**: Secure federated login API allowing third-party sites to authenticate users using their Meetup credentials.
- **Sub-category / Actionable Details**: User Authentication API. Register an application in the Meetup developer dashboard to receive a client ID and secret, configuring redirect URIs for secure user login.

### 38. Zoom Virtual Event Link Integration
- **Category**: Developer APIs & Integrations
- **Description**: Integrates with Zoom to automatically generate and assign virtual meeting links when organizers schedule an online event.
- **Sub-category / Actionable Details**: Video Conference Linking. When scheduling an online event, select "Zoom" as the host method, sign in to link your Zoom account, and the meeting URL will populate automatically.

### 39. WordPress Event Plugin Integration
- **Category**: Developer APIs & Integrations
- **Description**: Supports embedding Meetup group details and upcoming event calendars on external WordPress websites via shortcodes or widgets.
- **Sub-category / Actionable Details**: Web Widgets. Install the official Meetup block or widget plugin in WordPress, input your Meetup group URL, and publish to display live event schedules.

### 40. Zapier Automation Connectors
- **Category**: Developer APIs & Integrations
- **Description**: Integrates with Zapier to trigger automated actions (such as adding RSVPs to Google Sheets) when a user interacts with a Meetup group.
- **Sub-category / Actionable Details**: Automated Integrations. Create a Zap, choose Meetup as the trigger app, select the event (e.g., "New RSVP"), link your Google Sheets account as the action, and map the fields.

---

## Category 9: Notifications & Time Management

### 41. New Event Push Alerts
- **Category**: Notifications & Time Management
- **Description**: Sends immediate push notifications to a user's mobile device when a group they belong to publishes a new event.
- **Sub-category / Actionable Details**: Push Notifications. Go to Account Settings > Notifications, select the mobile push channel, and toggle the switch for "New event in joined groups" to active.

### 42. RSVP Reminders
- **Category**: Notifications & Time Management
- **Description**: Automatic email notifications sent to members 24 to 48 hours before an event, prompting them to confirm or update their RSVP status.
- **Sub-category / Actionable Details**: Email Reminders. System-generated emails are sent automatically based on event settings. Users can toggle "Upcoming event alerts" under Email Preferences.

### 43. Event Schedule Conflict Detector
- **Category**: Notifications & Time Management
- **Description**: Evaluates a user's calendar when they RSVP to an event and warns them if they have already committed to another Meetup at the same time.
- **Sub-category / Actionable Details**: Overlap Warning. If a time conflict exists when clicking "Attend," the platform displays an alert stating "You already have an event scheduled at this time. RSVP anyway?"

### 44. Quiet Hours / Snooze Alerts
- **Category**: Notifications & Time Management
- **Description**: Allows users to temporarily mute all push notification alerts from Meetup for a set period.
- **Sub-category / Actionable Details**: Alarm Muting. Navigate to App Settings > Notifications > Mute notifications, and select a snooze duration (e.g., "1 Hour," "8 Hours," or "Until tomorrow").

### 45. Weekly Group Digests
- **Category**: Notifications & Time Management
- **Description**: Sends a compiled email summarizing the upcoming week's events for all groups the user has joined.
- **Sub-category / Actionable Details**: Email Digests. Go to Settings > Email Preferences, scroll to "Weekly digest of local events," and toggle the switch on.

---

## Category 10: Account Settings & Authentication

### 46. Social Login Link (Google, Apple, Facebook)
- **Category**: Account Settings & Authentication
- **Description**: Allows users to link their Google, Apple, or Facebook accounts for secure, one-click login access.
- **Sub-category / Actionable Details**: Federated Identity. Go to Account Settings > Linked Accounts, click the "Connect" button next to Google, Apple, or Facebook, and authorize.

### 47. Two-Factor Authentication (2FA)
- **Category**: Account Settings & Authentication
- **Description**: Adds a layer of security by requiring a code from an authenticator app in addition to a password when logging in.
- **Sub-category / Actionable Details**: Security Hardening. Navigate to Account Settings > Security, toggle the "Two-factor authentication" switch, scan the QR code with your authenticator app, and enter the 6-digit confirmation code.

### 48. Location Radius Customization
- **Category**: Account Settings & Authentication
- **Description**: Allows users to set their primary city location and define the geographic search radius used to discover local events.
- **Sub-category / Actionable Details**: Location Targeting. Go to Profile Settings > Location, enter a city or zip code, select a radius slider value (from 5 miles to 100 miles), and click "Save."

### 49. GDPR Data Archive Download
- **Category**: Account Settings & Authentication
- **Description**: Provides users with a downloadable file containing all of their personal data, group memberships, and messages stored on the platform.
- **Sub-category / Actionable Details**: Privacy Downloads. Go to Settings > Privacy, click "Request data download," and wait for an email containing a link to download the ZIP data archive.

### 50. Account Deactivation & Deletion
- **Category**: Account Settings & Authentication
- **Description**: Self-service options for users to temporarily disable their profile or permanently delete their account and associated data.
- **Sub-category / Actionable Details**: Account Termination. Go to Account Settings, scroll to the bottom, click "Deactivate account" or "Request account deletion," enter your password to confirm, and click "Submit."
