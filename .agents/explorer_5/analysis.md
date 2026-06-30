# Batch 5 Feature Analysis & Implementation Proposals
**E-Commerce, Creator Tools, Analytics, and APIs**

This document provides a comprehensive audit of Batch 5 features, scans the existing codebase to identify implemented/missing elements, and proposes detailed architectural designs for real, functional, and integrated implementation of these features in the next phase.

---

## 1. Batch 5 Features & Statistics (from `implementation_tracker.md`)
A complete parsing of the implementation tracker shows that Batch 5 contains a total of **620 items** (295 Features, 295 Improvements, and 30 Innovations). They are distributed across three primary categories as follows:

| Category | Features | Improvements | Innovations | Category Total |
| :--- | :---: | :---: | :---: | :---: |
| **Monetization & E-Commerce** (Category 5) | 115 | 115 | 10 | **240** |
| **Analytics, Business & Creator Tools** (Category 6) | 87 | 87 | 10 | **184** |
| **Developer APIs & Integrations** (Category 8) | 93 | 93 | 10 | **196** |
| **Total** | **295** | **295** | **30** | **620** |

### Key Tracker Observations:
- **E-Commerce features** cover AR Shopping Lenses (F-444), Creator Storefronts (F-504), Digital Downloads (F-518), and Persistent Shopping Carts (F-548).
- **Creator & Analytics features** cover Earnings Analytics (F-583), Engagement Rate Calculations (F-608), Audience Location Demographics (F-565), and Ad Campaign Reporting (F-560).
- **APIs & Webhook features** cover Developer V2 Access (F-769), Webhook Subscriptions (F-810), Webhook Event Logs (F-811), and Webhook Payloads (F-812).

---

## 2. Codebase Scan & Audit (Existing vs. Missing)

We scanned the codebase and mapped current implementation details for the target modules:

### A. E-Commerce & Marketplace
- **Existing**:
  - **Prisma Schema**: `Product` (backed by DB, has sellerId, name, price, stock, views, sales, condition, category), `ProductReview`, and `Order` (backed by DB, holds purchaser, product, price, tracking, payment ID).
  - **APIs**: `/api/marketplace/route.ts` is fully functional with `GET` (search, sort, category filter) and `POST` (create new product listing) endpoints.
  - **UI/Pages**: `/marketplace/page.tsx` connects to `/api/marketplace` and allows users to search, filter, and create listings.
  - **UI Mockups**: `/shop/page.tsx` is a separate client-only mock shop page that reads `MOCK_PRODUCTS` from `@/lib/mockData` and utilizes client-side Zustand store `useCartStore` with localStorage.
  - **Components**: `src/components/commerce/ProductCard.tsx` and `ShoppingCart.tsx` represent the card and side-drawer shopping cart, but they only modify the local Zustand store.
- **Missing**:
  - **Database Cart**: Cart is not backed by the database. No `Cart` or `CartItem` models exist in `schema.prisma`.
  - **Product Details View**: No dedicated product details page or modal exists to inspect a product's full attributes (description, stock, ratings, seller location).
  - **Real Checkout Integration**: Checkout on the `/shop` page is purely simulated on the client with a 2-second timer. It does not submit a payload to any server endpoint, nor does it create database `Order` records, update inventory stock, or verify funds.
  - **Multi-Item Orders**: The existing `Order` model in Prisma links to a single `productId` with `quantity`, making it impossible to store multi-item checkouts in a single order row. No `OrderItem` model exists.

### B. Creator Analytics & Dashboard
- **Existing**:
  - **Prisma Schema**: `Analytics` model containing daily stats for impressions, reach, follower growth, post engagement metrics, and revenue.
  - **UI/Pages**: `/analytics/page.tsx` presents a user-facing analytics page. It displays mock overview metrics, SVG bar charts for post impressions, and SVG donut charts for content breakdown and gender demographics.
- **Missing**:
  - **No Analytics API**: There are no GET API routes (e.g. `/api/creator/analytics` or `/api/analytics`) to calculate real metrics.
  - **Mock Data dependence**: All charts, schedule grids, and indicators on `/analytics` are populated with random numbers or client-side mock parameters.
  - **No Creator Earnings breakdown**: The "Advanced Tools" tab renders a static placeholder: *"Commerce tools are currently unavailable."* No actual tipping, subscription, or shop sales revenues are queried or displayed.

### C. Ads Management
- **Existing**:
  - None.
- **Missing**:
  - **No DB Schema**: No models exist for advertising (`Ad`, `AdCampaign`, `AdAnalytics`, etc.).
  - **No APIs**: No endpoints to create ads, fetch active campaigns, or increment impressions/clicks.
  - **No Ads Manager UI**: No frontend views for creating ad campaigns, setting targeting options, or checking performance.

### D. Public APIs & Webhooks
- **Existing**:
  - None.
- **Missing**:
  - **No DB Schema**: No models exist for webhook subscriptions or delivery logs.
  - **No Webhook Subscriptions Management**: No developer settings API or UI to register/test webhook endpoints.
  - **No Trigger Hooks**: No system hooks to dispatch payloads to subscribers when key events occur (e.g., tipping a creator, subscribing, ordering products).

---

## 3. Concrete Implementation Proposals for Batch 5

Here is the design for real, functional features to implement for Batch 5.

### Proposal 1: Persistent Database-Backed Cart & Checkout Flow

To transition the commerce features from mock-ups to a real database-backed system:

#### 1. Schema Enhancements
Add `Cart`, `CartItem`, and `OrderItem` models to `prisma/schema.prisma` and make the `Order` model support multiple items (or keep backward compatibility by making `productId` optional and creating a relation to `OrderItem`):

```prisma
// Add to prisma/schema.prisma

model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([cartId, productId])
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int
  unitPrice Float
  createdAt DateTime @default(now())
}
```

*Compatibility adjustment for `Order`*:
Modify the existing `Order` model fields:
```prisma
model Order {
  id              String      @id @default(cuid())
  buyerId         String
  buyer           User        @relation("OrderBuyer", fields: [buyerId], references: [id])
  productId       String?     // Nullable for backward-compatibility
  product         Product?    @relation(fields: [productId], references: [id])
  quantity        Int         @default(1)
  unitPrice       Float
  total           Float
  status          String      @default("PENDING")
  shippingAddress String?
  trackingNumber  String?
  notes           String?
  stripePaymentId String?
  refundedAt      DateTime?
  refundReason    String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  items           OrderItem[] // Relation link for multi-item orders
}
```

#### 2. Cart API `/api/cart/route.ts`
Write an API that handles cart items for the authenticated user:
- `GET`: Retrieve user's cart from the database including products.
- `POST`: Add item to cart or increment quantity.
- `PUT`: Update quantity of a product in the cart.
- `DELETE`: Remove item or clear cart.

#### 3. Checkout API `/api/marketplace/checkout/route.ts`
Create a POST endpoint that processes checkouts:
- Read the user's current database cart items.
- For each item, verify `Product.inStock` is true and `Product.stockCount >= CartItem.quantity`.
- Perform database transaction:
  1. Create the `Order` record with a calculated `total` sum.
  2. Create `OrderItem` entries matching cart items.
  3. Decrement the `stockCount` of each `Product` by the purchased quantity. If stock reaches 0, update `inStock = false`.
  4. Clear all `CartItem` entries linked to the user's `Cart`.
- Return the created order details and database-backed `Order.id`.

#### 4. UI/Frontend Updates
- **Sync Zustand store**: Rewrite `src/store/cartStore.ts` to execute `apiFetch` calls to `/api/cart` on change, with client-side state serving as optimistic updates.
- **Product Details Modal**: Enhance `ProductCard.tsx` so clicking on the product image/title opens a detail popup containing seller bio, SKU, condition description, shipping instructions, and current stock status.
- **Real checkout request**: Modify the checkout modal in `/shop/page.tsx` to call `/api/marketplace/checkout` via POST upon credit card confirmation. Once done, clear the UI cart state and show the receipt page with the real database-generated Order ID.

---

### Proposal 2: Creator Analytics GET API & Live Earnings Dashboard

To replace the client-side mock stats with real-time aggregates:

#### 1. Analytics API `/api/creator/analytics/route.ts`
Provide a GET endpoint calculating real-time creator metrics over a specified date range (`?range=7d|30d|90d`):
- **Earnings Calculator**: Calculate total and broken-down earnings by querying:
  - Direct Product Sales: `prisma.order.findMany` where `product.sellerId === userId` and `status === 'SUCCESS'`.
  - Creator Subscriptions: `prisma.subscription.findMany` where `creatorId === userId` and `status === 'ACTIVE'`.
  - Tips Received: `prisma.tip.findMany` where `receiverId === userId`.
- **Post Performance**: Query `prisma.post.findMany` where `authorId === userId` to sum total likes, comments, and views to compute the average Engagement Rate (`(likes + comments) / views * 100`). Return the top 3 performing posts.
- **Follower Growth & Demographics**: Retrieve recent `Follow` records targeting the user, aggregated by date to calculate growth trends. Group followers by location and gender (using linked profile attributes) to compile demographic percentages.

#### 2. SVG Chart Components
Use the existing SVG charts (`BarChart`, `DonutChart`) but update their data bindings. Add a daily time-series line chart using SVG `<path>` elements to render earnings trends:
```tsx
function EarningsLineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const width = 500;
  const height = 150;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.value / max) * height * 0.8 - 15; // 80% scale + padding
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 text-primary">
      {/* Grid lines */}
      <line x1="0" y1={height - 15} x2={width} y2={height - 15} stroke="currentColor" strokeWidth="1" opacity="0.1" />
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeWidth="1" opacity="0.1" />
      {/* Path line */}
      <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points} className="stroke-primary" />
      {/* Area under curve */}
      <path fill="currentColor" opacity="0.05" d={`M 0,${height - 15} L ${points} L ${width},${height - 15} Z`} />
    </svg>
  );
}
```

#### 3. Advanced Tools Panel
Replace the static placeholder in `/analytics/page.tsx` with a live **Creator Earnings Hub** that splits income into Tabs: *Overview, Product Sales, Tips, Subscriptions*.

---

### Proposal 3: Integrated Ads Manager

Introduce ad campaigns so creators and brands can display sponsored posts.

#### 1. Schema Enhancements
Add the `Ad` model to track campaigns, targeting, and analytics:

```prisma
model Ad {
  id             String    @id @default(cuid())
  advertiserId   String
  advertiser     User      @relation(fields: [advertiserId], references: [id], onDelete: Cascade)
  title          String
  description    String
  imageUrl       String?
  targetUrl      String
  budget         Float
  spent          Float     @default(0)
  bidAmount      Float     @default(0.05) // CPC (Cost per Click)
  targetAgeMin   Int?
  targetAgeMax   Int?
  targetGender   String?   // "ALL", "MALE", "FEMALE", "OTHER"
  targetLocation String?   // "US", "UK", "CA", etc.
  status         String    @default("PAUSED") // "ACTIVE", "PAUSED", "COMPLETED", "OUT_OF_BUDGET"
  impressions    Int       @default(0)
  clicks         Int       @default(0)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

#### 2. Ads API `/api/ads/route.ts` & Tracking Endpoints
- **GET `/api/ads`**: List ads owned by the current advertiser.
- **POST `/api/ads`**: Create a new ad setting target demographics (age, gender, location) and budget.
- **GET `/api/ads/serve`**: Return a random active ad where targeting matches the logged-in user (location == user.location, gender == user.gender, user.age falls in target range).
- **POST `/api/ads/[id]/track`**: Register ad events (impressions/clicks). Takes a body `{ event: 'impression' | 'click' }`. Increments DB metrics and adds `bidAmount` to `Ad.spent`. If `spent >= budget`, flips status to `OUT_OF_BUDGET`.

#### 3. UI/Frontend Interface (`/ads/page.tsx`)
- Build an **Advertiser Console** displaying active campaigns, CTR (Click-Through Rate), budget consumption progress bars.
- Build an **Ad Creation Dialog** supporting fields:
  - Ad Copy (Title & Description)
  - Visual asset (Image URL)
  - Target Link URL
  - Audience targeting (Minimum/Maximum age sliders, Location code text input, Gender selection radios).
- **Feed Ad Insertion**: Place a simple `SponsoredAd` card inside the user's home feed that queries `/api/ads/serve` on load and logs impressions and clicks.

---

### Proposal 4: Developer Webhooks Infrastructure

Enable external services to receive event notifications (e.g. notifying a Discord bot of new tips or sales).

#### 1. Schema Enhancements
Add `WebhookSubscription` and `WebhookDeliveryLog` to database schemas:

```prisma
model WebhookSubscription {
  id          String                @id @default(cuid())
  userId      String
  user        User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  url         String
  secret      String                // Signed SHA-256 secret
  events      String                // JSON array, e.g. '["tip.received", "order.created"]'
  isActive    Boolean               @default(true)
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt
  logs        WebhookDeliveryLog[]
}

model WebhookDeliveryLog {
  id             String              @id @default(cuid())
  subscriptionId String
  subscription   WebhookSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  eventId        String
  eventType      String
  payload        String              // Sent JSON payload
  responseStatus Int?                // e.g. 200, 500
  responseBody   String?
  durationMs     Int?
  isSuccess      Boolean
  createdAt      DateTime            @default(now())
}
```

#### 2. Webhooks API & Simulator
- **GET `/api/developer/webhooks`**: Retrieve user's Webhook subscriptions and their 20 most recent delivery logs.
- **POST `/api/developer/webhooks`**: Register a webhook subscription (validates URL pattern, generates webhook secret, saves events).
- **POST `/api/developer/webhooks/test-trigger`**: Simulate a tipping event (e.g. tip.received).
  - Triggers a mock Axios request to the client's registered webhook URL containing a signed header `X-Wakka-Signature` (HMAC hex digest of payload signed with secret).
  - Records a `WebhookDeliveryLog` documenting status code, payload, response speed, and success/failure, making it easy to debug.

#### 3. Webhook Settings Panel (`/settings/developer`)
Create a settings panel where users can:
- Generate a new webhook registration.
- Select event subscriptions via checkboxes.
- View their webhook URL and copy the signing secret.
- View a live table of Webhook Delivery Logs showing event types, timestamps, HTTP status indicator badges, and expandable JSON payloads.
- Click a "Trigger Test Event" button to instantly simulate delivery and verify integration success.

---

## 4. Verification & Testing Strategy

To verify the integration once implemented:
1. **Database Migrations**: Check that `prisma migrate dev` executes cleanly and compiles models.
2. **Postman / Curl Validation**:
   - Add a product, fetch `/api/cart` and assert items match.
   - Run `/api/marketplace/checkout` and check that `Order`/`OrderItem` entries are created and `Product.stockCount` is decremented in SQLite.
   - Run `/api/creator/analytics` and verify response matches database-seeded Orders, Tips, and Subscriptions.
   - Hit `/api/ads/serve` and verify returned ads follow user targeting criteria.
3. **Webhook Sandbox Testing**:
   - Point a subscription to a public webhook logger (e.g. `webhook.site`).
   - Trigger a simulated test event from `/settings/developer` and confirm the request is received with a valid `X-Wakka-Signature` header.
