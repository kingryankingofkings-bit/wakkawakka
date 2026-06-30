# Handoff Report - Database & API Exploration for Batch 8 (Professional & Jobs)

## 1. Observation

During read-only investigation, the following files and code blocks were examined:

### A. Existing DB Configuration & Conventions (`prisma/schema.prisma`)
1. **Database Provider**: SQLite is configured as the dev database:
   ```prisma
   12: datasource db {
   13:   provider = "sqlite"
   14:   url      = env("DATABASE_URL")
   15: }
   ```
2. **Enums & Arrays**: SQLite does not support native enums or arrays. The existing schema manages array fields as serialized JSON strings:
   ```prisma
   184:   mediaUrls       String    @default("[]")
   185:   hashtags        String    @default("[]")
   186:   collaboratorIds String    @default("[]")
   ```
3. **User Model Profile Fields**: The `User` model currently contains standard bio/avatar details but lacks professional profiling fields:
   ```prisma
   42: model User {
   43:   id                 String    @id @default(cuid())
   ...
   47:   bio                String?
   48:   avatar             String?
   ...
   55:   isPremium          Boolean   @default(false)
   ```
4. **Parallels for Organization Pages**: The schema implements business/creator `Page` and associated membership/follower models:
   ```prisma
   1232: model Page {
   ...
   1248:   roles        PageMember[]
   1249:   followers    PageFollower[]
   ...
   ```

### B. Project Scope (`SCOPE.md`)
The scope for Batch 8 specifies:
1. **User updates**: Add `headline`, `workHistory` (JSON string array), `education` (JSON string array), and `skills` (JSON string array) to `User`.
2. **New Models**: `Company`, `Job`, `JobApplication`, `InMailMessage`, `Endorsement`, `Recommendation`, `LearningCourse`, `LearningEnrollment`, `Article`.
3. **Restricted Routes**: Premium routes (like InMail messaging) must check user premium status.

### C. Current Auth Pattern (`src/lib/currentUser.ts`)
The acting user is extracted using `getRequestUserId` from the `x-user-id` header or the `userId` query parameter:
```typescript
13: export function getRequestUserId(req: NextRequest, bodyUserId?: string): string | null {
14:   const header = req.headers.get('x-user-id');
15:   if (header) return header;
16:   const q = req.nextUrl.searchParams.get('userId');
17:   if (q) return q;
18:   return bodyUserId ?? null;
19: }
```

---

## 2. Logic Chain

Based on these observations, the database and API architecture for Batch 8 is proposed as follows:

1. **User Profile Arrays**:
   - Following the existing convention in the database (e.g. `mediaUrls String @default("[]")`), the professional profiling fields (`workHistory`, `education`, and `skills`) should be implemented as `String @default("[]")` to ensure full SQLite compatibility and align with the existing serialization architecture.
2. **Company Page Structure**:
   - LinkedIn-style company pages require administrative control and followers. We will model `Company` with an `ownerId` directly referencing `User` (the creator), alongside helper models `CompanyMember` and `CompanyFollower` (analogous to the existing `PageMember` and `PageFollower` models).
3. **Endorsements Representation**:
   - Instead of maintaining a flat list of endorsers inside a JSON array, an `Endorsement` is modeled as a separate relational entity (`Endorsement`) with a compound unique key `@@unique([targetUserId, endorserId, skill])`. This enables structured relational queries to count skill endorsements and prevents duplicate endorsements.
4. **Recommendation Lifecycle**:
   - Recommendations go through request, write, and approve stages. We model `Recommendation` with a `status` field (`REQUESTED` | `PENDING` | `APPROVED` | `REJECTED`) and relation fields mapping to the requester, writer, and receiver (all referencing the `User` model).
5. **InMail and Premium Enforcement**:
   - InMail messages are secured by verifying `user.isPremium === true` in the DB before allowing the creation of `InMailMessage`.

---

## 3. Caveats

- **SQLite Serialization**: Storing arrays as JSON strings means filtering jobs or users by specific skills in database-level queries requires text-containment checks (`like` queries) or application-level parsing.
- **Enums**: SQLite does not support native enums; statuses like `workplaceType` ("REMOTE", "HYBRID") and recommendation `status` ("PENDING", "APPROVED") are modeled as `String` and must be validated at the Next.js API route layer.
- **No Cascading on Critical Relations**: Ensure that deleting a `Company` deletes its listed `Job` postings and their associated `JobApplication` records, while keeping the user applicant profiles intact.

---

## 4. Conclusion

### A. Proposed Prisma Schema Additions

Add these fields to the `User` model in `prisma/schema.prisma`:

```prisma
// Fields within model User
model User {
  // ... existing fields ...
  
  headline                 String?
  workHistory              String                  @default("[]") // JSON string array
  education                String                  @default("[]") // JSON string array
  skills                   String                  @default("[]") // JSON string array

  ownedCompanies           Company[]               @relation("CompanyOwner")
  companyMemberships       CompanyMember[]
  companyFollows           CompanyFollower[]
  postedJobs               Job[]                   @relation("JobPoster")
  jobApplications          JobApplication[]        @relation("JobApplicant")
  sentInMails              InMailMessage[]         @relation("InMailSender")
  receivedInMails          InMailMessage[]         @relation("InMailReceiver")
  receivedEndorsements     Endorsement[]           @relation("EndorsementTarget")
  givenEndorsements        Endorsement[]           @relation("EndorsementSender")
  requestedRecommendations Recommendation[]        @relation("RecommendationRequester")
  receivedRecommendations  Recommendation[]        @relation("RecommendationReceiver")
  writtenRecommendations   Recommendation[]        @relation("RecommendationWriter")
  learningEnrollments      LearningEnrollment[]
  articles                 Article[]               @relation("ArticleAuthor")
}
```

Add these new models at the end of `prisma/schema.prisma`:

```prisma
// =============================================================================
// Professional & Jobs (Batch 8)
// =============================================================================

model Company {
  id           String           @id @default(cuid())
  name         String
  slug         String           @unique
  description  String?
  logoUrl      String?
  coverImage   String?
  website      String?
  industry     String?
  companySize  String?          // e.g. "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
  headquarters String?
  foundedAt    DateTime?
  ownerId      String
  owner        User             @relation("CompanyOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  
  members      CompanyMember[]
  followers    CompanyFollower[]
  jobs         Job[]

  @@index([ownerId])
}

model CompanyMember {
  id        String   @id @default(cuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      String   @default("MEMBER") // ADMIN | MEMBER
  joinedAt  DateTime @default(now())

  @@unique([companyId, userId])
  @@index([companyId])
  @@index([userId])
}

model CompanyFollower {
  id        String   @id @default(cuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([companyId, userId])
  @@index([companyId])
  @@index([userId])
}

model Job {
  id            String           @id @default(cuid())
  title         String
  description   String
  requirements  String?          // Serialized JSON string array of skills or requirements
  location      String?          // e.g. "San Francisco, CA"
  type          String           @default("FULL_TIME") // FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP | TEMPORARY
  workplaceType String           @default("ON_SITE")   // ON_SITE | HYBRID | REMOTE
  salaryRange   String?          // e.g. "$120,000 - $150,000"
  companyId     String
  company       Company          @relation(fields: [companyId], references: [id], onDelete: Cascade)
  posterId      String
  poster        User             @relation("JobPoster", fields: [posterId], references: [id], onDelete: Cascade)
  isActive      Boolean          @default(true)
  viewsCount    Int              @default(0)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  
  applications  JobApplication[]

  @@index([companyId])
  @@index([posterId])
  @@index([isActive])
}

model JobApplication {
  id          String   @id @default(cuid())
  jobId       String
  job         Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  applicantId String
  applicant   User     @relation("JobApplicant", fields: [applicantId], references: [id], onDelete: Cascade)
  resumeUrl   String?
  coverLetter String?
  status      String   @default("PENDING") // PENDING | REVIEWING | INTERVIEWING | OFFERED | REJECTED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([jobId, applicantId])
  @@index([jobId])
  @@index([applicantId])
}

model InMailMessage {
  id         String   @id @default(cuid())
  senderId   String
  sender     User     @relation("InMailSender", fields: [senderId], references: [id], onDelete: Cascade)
  receiverId String
  receiver   User     @relation("InMailReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
  subject    String?
  content    String
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([senderId])
  @@index([receiverId])
  @@index([createdAt])
}

model Endorsement {
  id           String   @id @default(cuid())
  skill        String
  targetUserId String
  targetUser   User     @relation("EndorsementTarget", fields: [targetUserId], references: [id], onDelete: Cascade)
  endorserId   String
  endorser     User     @relation("EndorsementSender", fields: [endorserId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())

  @@unique([targetUserId, endorserId, skill])
  @@index([targetUserId])
  @@index([endorserId])
}

model Recommendation {
  id           String   @id @default(cuid())
  requesterId  String?
  requester    User?    @relation("RecommendationRequester", fields: [requesterId], references: [id], onDelete: Cascade)
  receiverId   String
  receiver     User     @relation("RecommendationReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
  writerId     String
  writer       User     @relation("RecommendationWriter", fields: [writerId], references: [id], onDelete: Cascade)
  text         String
  relationship String?  // e.g. "Managed writer directly"
  status       String   @default("PENDING") // REQUESTED | PENDING | APPROVED | REJECTED
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([requesterId])
  @@index([receiverId])
  @@index([writerId])
}

model LearningCourse {
  id              String               @id @default(cuid())
  title           String
  description     String
  instructor      String
  category        String               // e.g. "Software Engineering", "Business"
  durationMinutes Int
  thumbnailUrl    String?
  videoUrl        String?
  isPremium       Boolean              @default(false)
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  
  enrollments     LearningEnrollment[]

  @@index([category])
}

model LearningEnrollment {
  id          String         @id @default(cuid())
  courseId    String
  course      LearningCourse @relation(fields: [courseId], references: [id], onDelete: Cascade)
  userId      String
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  progress    Float          @default(0.0) // 0.0 to 100.0
  completed   Boolean        @default(false)
  completedAt DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@unique([courseId, userId])
  @@index([courseId])
  @@index([userId])
}

model Article {
  id          String    @id @default(cuid())
  title       String
  content     String
  summary     String?
  coverImage  String?
  authorId    String
  author      User      @relation("ArticleAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  isPublished Boolean   @default(false)
  publishedAt DateTime?
  viewsCount  Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([authorId])
  @@index([isPublished])
  @@index([createdAt])
}
```

---

### B. TypeScript Interfaces (`src/types/index.ts`)

```typescript
export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  coverImage?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  headquarters?: string;
  foundedAt?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string[];
  location?: string;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  workplaceType: "ON_SITE" | "HYBRID" | "REMOTE";
  salaryRange?: string;
  companyId: string;
  company?: Company;
  posterId: string;
  isActive: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  job?: Job;
  applicantId: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: "PENDING" | "REVIEWING" | "INTERVIEWING" | "OFFERED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface InMailMessage {
  id: string;
  senderId: string;
  receiverId: string;
  subject?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Endorsement {
  id: string;
  skill: string;
  targetUserId: string;
  endorserId: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  requesterId?: string;
  receiverId: string;
  writerId: string;
  text: string;
  relationship?: string;
  status: "REQUESTED" | "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface LearningCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  durationMinutes: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearningEnrollment {
  id: string;
  courseId: string;
  course?: LearningCourse;
  userId: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  authorId: string;
  isPublished: boolean;
  publishedAt?: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}
```

---

### C. Proposed API Route Specifications

#### 1. Profile Routing (`/api/professional/profile`)
- **GET**
  - **Description**: Fetch the acting user's profile (`headline`, `workHistory`, `education`, `skills`).
  - **Headers**: `x-user-id: <string>`
  - **Success Response**: `200 OK`
    ```json
    {
      "headline": "Full-stack Engineer",
      "workHistory": [],
      "education": [],
      "skills": []
    }
    ```
- **PUT**
  - **Description**: Update the acting user's profile.
  - **Headers**: `x-user-id: <string>`
  - **Request Body**:
    ```json
    {
      "headline": "Lead Architect",
      "workHistory": [{"company": "A", "role": "SWE", "startDate": "2024-01-01"}],
      "education": [{"school": "B", "degree": "BS"}],
      "skills": ["TypeScript"]
    }
    ```
  - **Success Response**: `200 OK` (returns updated User object)

#### 2. Companies Routing (`/api/professional/companies`)
- **GET**
  - **Description**: Search or list company pages.
  - **Query Params**: `query` (optional name/industry search string)
  - **Success Response**: `200 OK` (list of `Company` entities)
- **POST**
  - **Description**: Create a business page.
  - **Headers**: `x-user-id: <string>`
  - **Request Body**:
    ```json
    {
      "name": "Acme Corp",
      "slug": "acme-corp",
      "description": "Enterprise Solutions",
      "logoUrl": "https://...",
      "coverImage": "https://...",
      "website": "https://acme.com",
      "industry": "Tech",
      "companySize": "11-50",
      "headquarters": "Seattle, WA",
      "foundedAt": "2021-03-01T00:00:00Z"
    }
    ```
  - **Success Response**: `201 Created`

#### 3. Single Company Routing (`/api/professional/companies/[id]`)
- **GET**
  - **Description**: Retrieve details of a specific company by slug or ID.
  - **Success Response**: `200 OK` with Company details (joined with followerCount and jobs).
- **PUT**
  - **Description**: Update company profile (Owner only).
  - **Headers**: `x-user-id: <string>`
  - **Success Response**: `200 OK` with updated Company record.
  - **Error Responses**: `403 Forbidden` if acting user is not the owner.

#### 4. Job Posting Routing (`/api/professional/jobs`)
- **GET**
  - **Description**: Search/filter active jobs.
  - **Query Params**: `companyId` (optional), `search` (optional), `type` (optional), `workplaceType` (optional)
  - **Success Response**: `200 OK` (array of `Job` objects)
- **POST**
  - **Description**: Create a job posting (accessible to Company owners/members).
  - **Headers**: `x-user-id: <string>`
  - **Request Body**:
    ```json
    {
      "title": "Senior React SWE",
      "description": "Build Next.js web applications",
      "requirements": ["React", "CSS", "TypeScript"],
      "location": "Remote",
      "type": "FULL_TIME",
      "workplaceType": "REMOTE",
      "salaryRange": "$140,000 - $170,000",
      "companyId": "company_cuid"
    }
    ```
  - **Success Response**: `201 Created`
  - **Error Responses**: `403 Forbidden` if user is not associated with company.

#### 5. Single Job Routing (`/api/professional/jobs/[id]`)
- **GET**
  - **Description**: Retrieve detailed job specifications.
  - **Success Response**: `200 OK`
- **PUT**
  - **Description**: Edit job description or close posting.
  - **Headers**: `x-user-id: <string>`
  - **Success Response**: `200 OK`
  - **Error Responses**: `403 Forbidden` if not poster or owner.

#### 6. Job Application Routing (`/api/professional/jobs/[id]/apply`)
- **POST**
  - **Description**: Submit an application for the job posting.
  - **Headers**: `x-user-id: <string>`
  - **Request Body**:
    ```json
    {
      "resumeUrl": "https://...",
      "coverLetter": "..."
    }
    ```
  - **Success Response**: `201 Created`
  - **Error Responses**: `400 Bad Request` if user already applied.

#### 7. InMail Messaging Routing (`/api/professional/inmail`)
- **GET**
  - **Description**: List sent/received InMails for the current user.
  - **Headers**: `x-user-id: <string>`
  - **Success Response**: `200 OK`
- **POST**
  - **Description**: Send a professional premium InMail message.
  - **Headers**: `x-user-id: <string>`
  - **Request Body**:
    ```json
    {
      "receiverId": "recipient_user_id",
      "subject": "Direct Recruiting Inquiry",
      "content": "We are seeking a lead engineer..."
    }
    ```
  - **Premium Verification Logic**:
    ```typescript
    const user = await prisma.user.findUnique({ where: { id: senderId } });
    if (!user?.isPremium) {
      return NextResponse.json({ error: "Premium subscription required to send InMail messages" }, { status: 403 });
    }
    ```
  - **Success Response**: `201 Created`
  - **Error Responses**: `403 Forbidden` for non-premium senders.

#### 8. Skill Endorsements Routing (`/api/professional/endorsements`)
- **GET**
  - **Description**: Fetch all endorsements for a specific user's skills.
  - **Query Params**: `userId`
  - **Success Response**: `200 OK`
- **POST**
  - **Description**: Endorse a skill for a user.
  - **Headers**: `x-user-id: <string>`
  - **Request Body**:
    ```json
    {
      "targetUserId": "user_cuid",
      "skill": "TypeScript"
    }
    ```
  - **Success Response**: `201 Created`
- **DELETE**
  - **Description**: Remove an endorsement.
  - **Headers**: `x-user-id: <string>`
  - **Query Params**: `targetUserId`, `skill`
  - **Success Response**: `200 OK`

#### 9. Recommendations Routing (`/api/professional/recommendations`)
- **GET**
  - **Description**: Fetch recommendations (written, received, or requested).
  - **Query Params**: `userId` (filter by recipient), `writerId` (filter by writer), `status` (PENDING | APPROVED)
  - **Success Response**: `200 OK`
- **POST**
  - **Description**: Write a recommendation, or request a recommendation from a peer.
  - **Headers**: `x-user-id: <string>`
  - **Request Body**:
    - *Requesting*: `{"writerId": "...", "relationship": "..."}` -> Status becomes `REQUESTED`.
    - *Writing (Unsolicited)*: `{"receiverId": "...", "text": "...", "relationship": "..."}` -> Status becomes `PENDING`.
    - *Fulfilling a request*: `{"recommendationId": "...", "text": "..."}` -> Updates status from `REQUESTED` to `PENDING`.
  - **Success Response**: `201 Created` / `200 OK`
- **PUT**
  - **Description**: Approve/publish a received recommendation to display on profile (Receiver only).
  - **Headers**: `x-user-id: <string>`
  - **Request Body**:
    ```json
    {
      "recommendationId": "rec_cuid",
      "status": "APPROVED" // or "REJECTED"
    }
    ```
  - **Success Response**: `200 OK`
  - **Error Responses**: `403 Forbidden` if receiverId !== acting user.

#### 10. Learning Course Catalog (`/api/professional/learning`)
- **GET**
  - **Description**: Retrieve available courses.
  - **Query Params**: `category` (optional)
  - **Success Response**: `200 OK` (list of `LearningCourse` objects)
- **POST**
  - **Description**: Enroll in a learning course.
  - **Headers**: `x-user-id: <string>`
  - **Request Body**: `{"courseId": "course_cuid"}`
  - **Success Response**: `201 Created` (returns the enrollment)

#### 11. Learning Course Progress (`/api/professional/learning/[id]/progress`)
- **PUT**
  - **Description**: Update enrollment progress.
  - **Headers**: `x-user-id: <string>`
  - **Path Param**: `id` (the courseId)
  - **Request Body**: `{"progress": 100.0}`
  - **Business Logic**: If progress is set to `100.0`, the system automatically flags `completed = true` and populates `completedAt = now()`.
  - **Success Response**: `200 OK`

#### 12. Articles Dashboard (`/api/professional/articles`)
- **GET**
  - **Description**: List articles (defaults to published articles; drafts are only shown to their author).
  - **Query Params**: `authorId` (optional), `includeDrafts` (optional)
  - **Success Response**: `200 OK`
- **POST**
  - **Description**: Create or publish a new long-form article.
  - **Headers**: `x-user-id: <string>`
  - **Request Body**:
    ```json
    {
      "title": "Scaling Social Media Databases",
      "content": "# Markdown content here...",
      "summary": "Best practices for schema design.",
      "coverImage": "https://...",
      "isPublished": true
    }
    ```
  - **Success Response**: `201 Created`

---

## 5. Verification Method

Once the implementer integrates the schema additions, verification can be run as follows:

1. **Schema Validation**:
   Validate that the new models and relationships are syntax-correct by running:
   ```bash
   npx prisma validate
   ```
2. **Database Push**:
   Apply changes locally and regenerate the Prisma Client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
3. **E2E Integration Testing**:
   Implement test cases in a new E2E test file (`tests/professional_jobs.test.js`) and run:
   ```bash
   node tests/e2e_runner.js
   ```
   *Note: Ensure test coverage checks:*
   - Unauthenticated profile fetching returns error / redirects.
   - Sending an InMail checks `isPremium` and blocks non-premium users with `403 Forbidden`.
   - Applying to the same job twice returns a duplicate application constraint error.
   - Recommendation status transitioning from `REQUESTED` -> `PENDING` -> `APPROVED` restricts approval rights to the receiver user.
