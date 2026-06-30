# Handoff Report: Frontend UI & Test Exploration for Batch 8 (Professional & Jobs)

## 1. Observation
We observed the following files and structural constraints within the codebase:

1. **Project Outline and Milestone Configuration** (`C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\PROJECT.md`):
   - Line 11 defines the E2E runner type:
     `- **Testing**: Opaque-box E2E integration runner in Node.js.`
   - Line 20 defines the test suite file path:
     `- tests/e2e_runner.js - Test Suite`
   - Line 28 describes Milestone 8:
     `| M8  | Professional & Jobs                  | LinkedIn-style profiles, job posting & search, company pages, InMail, learning, articles              | None         | PLANNED |`

2. **Scope Guidelines** (`C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\.agents\orchestrator_gen5\SCOPE.md`):
   - Lines 5-7 list the schema additions:
     `- Add fields to User for professional profiles: headline, workHistory (JSON string array), education (JSON string array), skills (JSON string array).`
     `- Add models: Company, Job, JobApplication, InMailMessage, Endorsement, Recommendation, LearningCourse, LearningEnrollment, Article.`
   - Lines 8-20 specify the endpoints:
     `- /api/professional/profile`
     `- /api/professional/companies`
     `- /api/professional/companies/[id]`
     `- /api/professional/jobs`
     `- /api/professional/jobs/[id]`
     `- /api/professional/jobs/[id]/apply`
     `- /api/professional/inmail`
     `- /api/professional/endorsements`
     `- /api/professional/recommendations`
     `- /api/professional/learning`
     `- /api/professional/learning/[id]/progress`
     `- /api/professional/articles`
   - Lines 21-27 define the frontend route layout requirements:
     `- Create route /jobs for job listing feed, filter controls, post-job form, and application tracking.`
     `- Create route /companies/[slug] for viewing company organization details and current job listings.`
     `- Create route /learning showing course catalog and active progress tracking widgets.`
     `- Create route /articles for publishing long-form newsletters and viewing published articles.`
     `- Integrate professional tab in User Profile view showing headline, skills, endorsements, work experience, education, and recommendations.`
     `- Provide InMail message initiation modal on user profile pages.`

3. **Existing Page Route Layout** (`C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\src/app/(main)/layout.tsx`):
   - Lines 20-30 wrap the page and sidebar:
     ```typescript
     {/* Desktop sidebar */}
     <div className="hidden md:block">
       <Sidebar />
     </div>

     {/* Main content area */}
     <div
       className={cn(
         "md:pl-64 flex min-h-screen",
         isServerWorkspace && "md:pl-64",
       )}
     >
     ```
   - Lines 31-48 configure content widths:
     ```typescript
     <main
       className={cn(
         "flex-1 w-full py-0 pb-16 md:pb-0",
         isServerWorkspace
           ? "max-w-none px-0"
           : "max-w-2xl mx-auto px-0 sm:px-4",
       )}
     >
       {children}
     </main>
     ```

4. **Sidebar Component Structure** (`C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\src/components/layout/Sidebar.tsx`):
   - Lines 16-35 define the `NAV_ITEMS` array:
     ```typescript
     const NAV_ITEMS = [
       { href: '/feed', icon: Home, label: 'Feed' },
       { href: '/explore', icon: Compass, label: 'Explore' },
       ...
       { href: '/scheduling', icon: Calendar, label: 'Scheduling' },
     ];
     ```

5. **Test Runner Framework** (`C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\tests/e2e_runner.js`):
   - Line 36 defines the custom test queuing:
     ```javascript
     function runTest(tier, name, fn) {
       pendingTests.push({ tier, name, fn });
     }
     ```
   - Lines 1186-1215 spawn the Next.js server locally and run assertions using `fetch` with headers:
     ```javascript
     serverProcess = spawn('node', [tsxPath, 'server.ts'], { env });
     // ...
     const authRes = await fetch(`${baseUrl}/api/servers`, { method: 'POST' });
     assertEq(authRes.status, 401, 'Should return 401 Unauthorized when missing x-user-id header on POST');
     ```

---

## 2. Logic Chain
1. **Responsive Constraints & Page Widths**: Because `layout.tsx` enforces `max-w-2xl mx-auto` for non-server pages to preserve focus on the main content feed, the job listings feed, learning catalog, and article explorer must align to this width. However, complex interfaces like the split-pane job search interface or the multi-column company profile will require a layout that adapts gracefully from single-column on mobile/tablet to rich grid systems.
2. **Component Reuse & Modularization**: Since several widgets (e.g. `JobCard`) are shared between the general Job search portal `/jobs` and specific company sub-views `/companies/[slug]`, they must be designed as reusable components.
3. **Sidebar Updates**: Adding `/jobs`, `/learning`, and `/articles` links directly to `NAV_ITEMS` in `Sidebar.tsx` will allow users to seamlessly transition between social feeds and professional modules. The icons `Briefcase`, `GraduationCap`, and `Newspaper` from `lucide-react` are appropriate visual matches.
4. **E2E Test Implementation**: Since the E2E test runner interacts with the database (Prisma) and makes server HTTP queries on local routes using simulated user authentication (via headers like `x-user-id`), the E2E tests for Batch 8 must:
   - Programmatically populate test entities (e.g. jobs, courses, and premium credentials) via Prisma inside the test closures.
   - Run authenticated HTTP requests to the proposed `/api/professional/` endpoints.
   - Verify proper database assertions, HTTP status codes, and quota logic (e.g., InMail quota decrementation).
   - Clean up created records in a `finally` block to prevent database bloat.

---

## 3. Caveats
- **Premium Check Integration**: We assume premium user status checks rely on the existing database field `User.isPremium` (observed in `prisma/schema.prisma` line 55). If billing/subscription structures are modified elsewhere, the InMail test case must be updated to align with the new model.
- **Rich Text Editor**: For the newsletter publisher editor (/articles), this design assumes the frontend will implement a lightweight editor (e.g., TipTap or simple contenteditable) saving to a Markdown or HTML string in the database.
- **Code Modification Limits**: As this is a read-only investigation, these proposals represent design layout layouts and test specifications. They are not yet written to codebase source files.

---

## 4. Conclusion

### A. Proposed UI Layout Designs & Component Hierarchies

#### 1. Job Search Portal (`/jobs`)
Designed as a split-pane layout on desktop and tabbed views on mobile.
- **Component Hierarchy**:
  - `src/app/(main)/jobs/page.tsx` (Main Route Entry)
    - `JobsFilterSidebar` (Left-hand panel, filters: Job Type, Location, Experience Level, Salary Range. Includes "Post Job" CTA button)
    - `JobSearchHeader` (Combines keyword input, location input, and search trigger)
    - `Tabs` (Radix UI Tabs wrapper)
      - `TabsList` ("Find Jobs", "My Applications")
      - `TabsContent` value="find"
        - `JobList` (Renders scrollable feed of job postings)
          - `JobCard` (Job metadata: title, company name/avatar, location, salary range, date posted, quick-tags)
        - `JobDetailPanel` (Split screen detail view; on mobile, opens as slide-over drawer)
          - `ApplyJobDialog` (Form modal: resume upload, input contact details, cover note, submits to `/api/professional/jobs/[id]/apply`)
      - `TabsContent` value="applications"
        - `ApplicationTrackerList` (Displays lists categorized by status: `PENDING`, `REVIEWING`, `INTERVIEWING`, `OFFERED`, `REJECTED`)
    - `PostJobDialog` (Modal accessible by employers to fill out job details, submitting to `/api/professional/jobs`)

#### 2. Company Profile (`/companies/[slug]`)
Detailed public-facing page showcasing company details and listing active openings.
- **Component Hierarchy**:
  - `src/app/(main)/companies/[slug]/page.tsx`
    - `CompanyHeader` (Cover banner, logo avatar, tagline, industry, follower metrics, and "Follow" toggle. Dynamic edit button if user is verified owner)
    - `Tabs`
      - `TabsList` ("Home", "About", "Jobs", "People")
      - `TabsContent` value="home"
        - `CompanyOverview` (Quick summary, recent company posts feed)
      - `TabsContent` value="about"
        - `CompanyDetailsCard` (Detailed description, website link, company size, founded date, headquarters location)
      - `TabsContent` value="jobs"
        - `CompanyJobsList` (Reuses `JobCard` component, pre-filtered for the current company ID)
      - `TabsContent` value="people"
        - `EmployeeGrid` (List of user cards showing employees registered under this company)

#### 3. Course Library (`/learning`)
A centralized portal for professional development and skill acquisition.
- **Component Hierarchy**:
  - `src/app/(main)/learning/page.tsx`
    - `LearningHeader` (Hero banner with search input and general learning motivation quote)
    - `Tabs`
      - `TabsList` ("Browse Catalog", "My Progress")
      - `TabsContent` value="browse"
        - `CourseCategorySection` (Horizontal scrolling categories: Tech, Design, Management)
          - `CourseCard` (Course thumbnail, duration, complexity level, instructor name, rating, "Enroll" trigger button)
        - `CourseDetailsModal` (Course curriculum details, module outline, syllabus)
      - `TabsContent` value="progress"
        - `ActiveEnrollmentsList` (Grid of current enrollments)
          - `ActiveCourseCard` (Progress bar component: e.g. 60% complete, "Resume" button)
            - `CoursePlayerModal` (Embeds HTML5 video player, sidebar with lessons checklist, "Mark as Completed", "Download Certificate" action when progress reaches 100%)

#### 4. Newsletter Publisher (`/articles`)
Layout for viewing newsletter articles and writing long-form posts.
- **Component Hierarchy**:
  - `src/app/(main)/articles/page.tsx`
    - `Tabs`
      - `TabsList` ("Articles Feed", "Write Article", "Dashboard")
      - `TabsContent` value="read"
        - `ArticlesFeed` (Renders feed of long-form articles. Clicking an article opens `ArticleReader` route)
          - `ArticleReader` (Layout optimized for reading: serif fonts, reading time, share actions, comment section)
      - `TabsContent` value="write"
        - `ArticleWriter` (Rich text editor form: title, cover image upload, categories, tags, text-body editor toolbar)
      - `TabsContent` value="dashboard"
        - `AuthorDashboard` (Renders lists of drafts and published articles alongside view counters and interaction metrics)

#### 5. Professional User Profile Widgets
Integrated into the profile page `/profile/[username]`.
- **Component Hierarchy**:
  - `UserProfileProfessionalSection` (Collapsible sections on profile header)
    - `ProfessionalHeadline` (Sub-name line, e.g. "Lead Developer at Wakka")
    - `WorkExperienceWidget`
      - `ExperienceItem` (Lists title, company, duration, description. Edit buttons present for profile owner)
      - `AddEditExperienceModal` (Form input)
    - `EducationWidget`
      - `EducationItem` (Lists school, degree, dates, notes)
      - `AddEditEducationModal` (Form input)
    - `SkillsWidget`
      - `SkillTagList` (List of skills; includes numerical endorsement counts)
        - `EndorseButton` (Increments endorsement count via `/api/professional/endorsements`)
        - `EndorsersHovercard` (Shows details of users who endorsed the skill)
    - `RecommendationsWidget`
      - `RecommendationList` (Shows recommended notes from peers)
      - `RequestRecommendationModal` (Initiates request flow)
      - `WriteRecommendationModal` (Allows peer to write a recommendation)
    - `InMailButton` (Visible on other users' profiles, gates access and triggers the modal below)
      - `InMailModal` (Subject line, body text, premium quota validator, triggers `/api/professional/inmail`)

---

### B. Proposed Sidebar Navigation Updates

To register the new sections in the left sidebar layout, we propose editing `src/components/layout/Sidebar.tsx` as follows:

```diff
diff --git a/src/components/layout/Sidebar.tsx b/src/components/layout/Sidebar.tsx
index db3c8f8..f7a28e9 100644
--- a/src/components/layout/Sidebar.tsx
+++ b/src/components/layout/Sidebar.tsx
@@ -4,7 +4,7 @@ import Link from 'next/link';
 import { usePathname } from 'next/navigation';
 import { useTheme } from 'next-themes';
 import { motion, AnimatePresence } from 'framer-motion';
-import { Home, Compass, Film, Radio, MessageCircle, Bell, Users, ShoppingBag, BarChart2, User, Settings, Zap, LogOut, Mic, BookMarked, Plus, UserPlus, Calendar, Flag, Store, Clock, Sun, Moon, Shield, Server } from 'lucide-react';
+import { Home, Compass, Film, Radio, MessageCircle, Bell, Users, ShoppingBag, BarChart2, User, Settings, Zap, LogOut, Mic, BookMarked, Plus, UserPlus, Calendar, Flag, Store, Clock, Sun, Moon, Shield, Server, Briefcase, GraduationCap, Newspaper } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Avatar } from '@/components/ui/Avatar';
 import { useAuthStore } from '@/store/authStore';
@@ -20,6 +20,9 @@ const NAV_ITEMS = [
   { href: '/servers', icon: Server, label: 'Servers' },
   { href: '/reels', icon: Film, label: 'Reels' },
   { href: '/live', icon: Radio, label: 'Live' },
+  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
+  { href: '/learning', icon: GraduationCap, label: 'Learning' },
+  { href: '/articles', icon: Newspaper, label: 'Articles' },
   { href: '/messages', icon: MessageCircle, label: 'Messages', badge: 'dm' },
   { href: '/notifications', icon: Bell, label: 'Notifications', badge: 'notif' },
   { href: '/friends', icon: UserPlus, label: 'Friends' },
```

---

### C. Proposed E2E Test Cases for `tests/e2e_runner.js`

Below are three test suites configured to run within the `tests/e2e_runner.js` harness:

```javascript
// ============================================================================
// BATCH 8: PROFESSIONAL & JOBS E2E TESTS (PROPOSED)
// ============================================================================

runTest('tier4', 'Professional Jobs Platform Workflow: Create Company -> Post Job -> Apply -> Review Status', async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const port = 4055;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const employer = await prisma.user.findUnique({ where: { username: 'wakkadev' } });
    const applicant = await prisma.user.findUnique({ where: { username: 'alicedev' } });
    assert(employer && applicant, 'Seeded users wakkadev and alicedev must exist');

    // 1. Create Company
    const companyRes = await fetch(`${baseUrl}/api/professional/companies`, {
      method: 'POST',
      headers: {
        'x-user-id': employer.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'WakkaCorp',
        description: 'Building the future of social networks',
        industry: 'Technology',
        size: '11-50 employees',
        website: 'https://wakkacorp.io',
        location: 'Remote'
      })
    });
    assertEq(companyRes.status, 200, 'Should successfully create company page');
    const companyData = await companyRes.json();
    const companyId = companyData.data.id;
    assert(companyId, 'Created company must return a valid ID');

    // 2. Post a Job under that Company
    const jobRes = await fetch(`${baseUrl}/api/professional/jobs`, {
      method: 'POST',
      headers: {
        'x-user-id': employer.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        companyId: companyId,
        title: 'Senior E2E Automation Engineer',
        location: 'Remote',
        type: 'FULL_TIME',
        salary: '$130,000 - $160,000',
        description: 'Design and write Node.js E2E test suites',
        requirements: JSON.stringify(['Node.js', 'Prisma', 'E2E Testing'])
      })
    });
    assertEq(jobRes.status, 200, 'Should successfully post a job');
    const jobData = await jobRes.json();
    const jobId = jobData.data.id;
    assert(jobId, 'Created job must return a valid ID');

    // 3. Search and list jobs (Verification for Applicant)
    const listRes = await fetch(`${baseUrl}/api/professional/jobs?search=Automation`, {
      headers: { 'x-user-id': applicant.id }
    });
    assertEq(listRes.status, 200, 'Should list jobs successfully');
    const listData = await listRes.json();
    const foundJob = listData.data.find(j => j.id === jobId);
    assert(foundJob, 'Applicant search must find the newly posted job');

    // 4. Apply for the Job posting
    const applyRes = await fetch(`${baseUrl}/api/professional/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'x-user-id': applicant.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resumeUrl: 'https://example.com/resumes/alice.pdf',
        coverLetter: 'I have extensive experience running integration suites in Next.js'
      })
    });
    assertEq(applyRes.status, 200, 'Applicant should apply successfully');
    const applyData = await applyRes.json();
    const applicationId = applyData.data.id;

    // 5. Database check for Application
    const dbApp = await prisma.jobApplication.findUnique({
      where: { id: applicationId }
    });
    assert(dbApp, 'Application record must persist in SQLite DB');
    assertEq(dbApp.status, 'PENDING', 'Initial application status must be PENDING');
    assertEq(dbApp.applicantId, applicant.id);

    // 6. Employer updates application status (Review status)
    const reviewRes = await fetch(`${baseUrl}/api/professional/jobs/${jobId}/apply`, {
      method: 'PATCH',
      headers: {
        'x-user-id': employer.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        applicationId: applicationId,
        status: 'INTERVIEWING'
      })
    });
    assertEq(reviewRes.status, 200, 'Employer should update status to INTERVIEWING');

    const dbAppUpdated = await prisma.jobApplication.findUnique({
      where: { id: applicationId }
    });
    assertEq(dbAppUpdated.status, 'INTERVIEWING', 'Application status should update to INTERVIEWING');

    // Cleanup
    await prisma.jobApplication.delete({ where: { id: applicationId } });
    await prisma.job.delete({ where: { id: jobId } });
    await prisma.company.delete({ where: { id: companyId } });

  } finally {
    await prisma.$disconnect();
  }
});

runTest('tier4', 'Professional InMail Quota and Message Gating: Free vs Premium', async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const port = 4055;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const sender = await prisma.user.findUnique({ where: { username: 'wakkadev' } });
    const receiver = await prisma.user.findUnique({ where: { username: 'alicedev' } });
    assert(sender && receiver, 'Seeded users wakkadev and alicedev must exist');

    // 1. Force Free status on sender
    await prisma.user.update({
      where: { id: sender.id },
      data: { isPremium: false }
    });

    // 2. Try sending InMail as Free User (Expect rejection)
    const freeInMailRes = await fetch(`${baseUrl}/api/professional/inmail`, {
      method: 'POST',
      headers: {
        'x-user-id': sender.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiverId: receiver.id,
        subject: 'Networking Inquiry',
        body: 'I would like to add you to my professional network.'
      })
    });
    assertEq(freeInMailRes.status, 403, 'Free users should be blocked from sending InMail messages');

    // 3. Force Premium status on sender and set quota
    await prisma.user.update({
      where: { id: sender.id },
      data: {
        isPremium: true,
        inmailQuota: 1 // Proposed integer quota field
      }
    });

    // 4. Send InMail as Premium User (Expect Success)
    const premiumInMailRes = await fetch(`${baseUrl}/api/professional/inmail`, {
      method: 'POST',
      headers: {
        'x-user-id': sender.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiverId: receiver.id,
        subject: 'Collaboration Invitation',
        body: 'Hi Alice, let\'s collaborate on a next-generation platform.'
      })
    });
    assertEq(premiumInMailRes.status, 200, 'Premium user with available quota should successfully send InMail');
    const inmailData = await premiumInMailRes.json();
    const inmailMessageId = inmailData.data.id;

    // 5. Verify database record and quota deduction
    const dbInMail = await prisma.inMailMessage.findUnique({
      where: { id: inmailMessageId }
    });
    assert(dbInMail, 'InMail record must exist in DB');
    assertEq(dbInMail.subject, 'Collaboration Invitation');

    const updatedSender = await prisma.user.findUnique({ where: { id: sender.id } });
    assertEq(updatedSender.inmailQuota, 0, 'InMail quota must decrement by 1 upon sending');

    // 6. Try sending again with exhausted quota (Expect rejection)
    const exhaustedQuotaRes = await fetch(`${baseUrl}/api/professional/inmail`, {
      method: 'POST',
      headers: {
        'x-user-id': sender.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiverId: receiver.id,
        subject: 'Follow-up',
        body: 'Just checking in on the previous message.'
      })
    });
    assertEq(exhaustedQuotaRes.status, 403, 'Should reject InMail request if monthly quota is 0');

    // Cleanup
    await prisma.inMailMessage.delete({ where: { id: inmailMessageId } });
    await prisma.user.update({
      where: { id: sender.id },
      data: {
        isPremium: false,
        inmailQuota: 0
      }
    });

  } finally {
    await prisma.$disconnect();
  }
});

runTest('tier4', 'Learning Progress and Course Completion: Progress updates -> Certificate Issue', async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const port = 4055;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const student = await prisma.user.findUnique({ where: { username: 'bobdev' } });
    assert(student, 'Seeded user bobdev must exist');

    // 1. Create a course in DB
    const course = await prisma.learningCourse.create({
      data: {
        title: 'Introduction to Next.js 14 App Router',
        description: 'Learn layouts, loading states, server actions, and route handlers',
        instructor: 'Dr. Wakka',
        duration: '4 hours',
        level: 'INTERMEDIATE',
        modulesList: JSON.stringify(['routing', 'rendering', 'data-fetching', 'optimization'])
      }
    });
    assert(course.id, 'Course record should be created');

    // 2. Enroll student in the course
    const enrollRes = await fetch(`${baseUrl}/api/professional/learning`, {
      method: 'POST',
      headers: {
        'x-user-id': student.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        courseId: course.id
      })
    });
    assertEq(enrollRes.status, 200, 'Student should successfully enroll in course');
    const enrollData = await enrollRes.json();
    const enrollmentId = enrollData.data.id;

    // Verify initial enrollment progress
    const dbEnrollment = await prisma.learningEnrollment.findUnique({
      where: { id: enrollmentId }
    });
    assertEq(dbEnrollment.progressPercentage, 0, 'Initial progress percentage should be 0');
    assertEq(dbEnrollment.status, 'ENROLLED', 'Initial enrollment status should be ENROLLED');

    // 3. Update partial progress
    const progress1Res = await fetch(`${baseUrl}/api/professional/learning/${course.id}/progress`, {
      method: 'PATCH',
      headers: {
        'x-user-id': student.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        progressPercentage: 50,
        completedModules: JSON.stringify(['routing', 'rendering'])
      })
    });
    assertEq(progress1Res.status, 200, 'Should update partial course progress');

    const dbEnrollmentMid = await prisma.learningEnrollment.findUnique({
      where: { id: enrollmentId }
    });
    assertEq(dbEnrollmentMid.progressPercentage, 50, 'DB progress should update to 50%');
    assertEq(dbEnrollmentMid.status, 'IN_PROGRESS', 'Status should change to IN_PROGRESS');

    // 4. Complete course (100% progress)
    const progress2Res = await fetch(`${baseUrl}/api/professional/learning/${course.id}/progress`, {
      method: 'PATCH',
      headers: {
        'x-user-id': student.id,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        progressPercentage: 100,
        completedModules: JSON.stringify(['routing', 'rendering', 'data-fetching', 'optimization'])
      })
    });
    assertEq(progress2Res.status, 200, 'Should mark progress as 100%');
    const progress2Data = await progress2Res.json();
    assert(progress2Data.data.certificateUrl, 'Completing the course must generate a certificate URL');

    const dbEnrollmentFinal = await prisma.learningEnrollment.findUnique({
      where: { id: enrollmentId }
    });
    assertEq(dbEnrollmentFinal.progressPercentage, 100, 'DB progress should update to 100%');
    assertEq(dbEnrollmentFinal.status, 'COMPLETED', 'Status should change to COMPLETED');

    // Verify profile badge issued
    const badge = await prisma.badge.findFirst({
      where: {
        userId: student.id,
        name: 'Next.js App Router Certification'
      }
    });
    assert(badge, 'Badge for course completion must be issued and saved in User badges');

    // Cleanup
    if (badge) {
      await prisma.badge.delete({ where: { id: badge.id } });
    }
    await prisma.learningEnrollment.delete({ where: { id: enrollmentId } });
    await prisma.learningCourse.delete({ where: { id: course.id } });

  } finally {
    await prisma.$disconnect();
  }
});
```

---

## 5. Verification Method
1. **Sidebar Navigation Updates**: 
   - Open `src/components/layout/Sidebar.tsx` and verify that the items match the replacement pattern.
   - Run the local compiler: `npm run build` or `npm run dev` to verify the module imports compiles successfully.
   - Access the browser on development server (`http://localhost:3000`) and verify that three new sidebar links ("Jobs", "Learning", "Articles") render properly on the desktop layout and lead to their respective paths.
2. **E2E Test Execution**:
   - Append the proposed code blocks to `tests/e2e_runner.js` inside the appropriate runner blocks.
   - Execute the test runner using command line in PowerShell:
     `node tests/e2e_runner.js`
   - Observe the terminal output. Confirm that the status reports:
     `✓ [TIER4] Professional Jobs Platform Workflow: Create Company -> Post Job -> Apply -> Review Status`
     `✓ [TIER4] Professional InMail Quota and Message Gating: Free vs Premium`
     `✓ [TIER4] Learning Progress and Course Completion: Progress updates -> Certificate Issue`
   - Ensure the summary records 0 failures.
