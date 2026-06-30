# Scope: Batch 8 (Professional & Jobs, LinkedIn-style)

## Architecture & Requirements
We are implementing a full LinkedIn-style professional networking and jobs system containing:
1. **Prisma Schema updates**:
   - Add fields to `User` for professional profiles: `headline`, `workHistory` (JSON string array), `education` (JSON string array), `skills` (JSON string array).
   - Add models: `Company`, `Job`, `JobApplication`, `InMailMessage`, `Endorsement`, `Recommendation`, `LearningCourse`, `LearningEnrollment`, `Article`.
2. **API Routes**:
   - `/api/professional/profile`: Fetch/Update current user's professional profile.
   - `/api/professional/companies`: List/Create business company pages.
   - `/api/professional/companies/[id]`: Retrieve/Update company configurations.
   - `/api/professional/jobs`: List/Create jobs postings.
   - `/api/professional/jobs/[id]`: Retrieve/Update job specifications.
   - `/api/professional/jobs/[id]/apply`: Apply to a job posting.
   - `/api/professional/inmail`: Send/List professional InMail-style messages.
   - `/api/professional/endorsements`: Handle skill endorsements.
   - `/api/professional/recommendations`: Request/Write/Approve recommendations.
   - `/api/professional/learning`: List courses, enroll.
   - `/api/professional/learning/[id]/progress`: Update enrollment progress.
   - `/api/professional/articles`: Newsletter/article publishing dashboard.
3. **Frontend Changes**:
   - Create route `/jobs` for job listing feed, filter controls, post-job form, and application tracking.
   - Create route `/companies/[slug]` for viewing company organization details and current job listings.
   - Create route `/learning` showing course catalog and active progress tracking widgets.
   - Create route `/articles` for publishing long-form newsletters and viewing published articles.
   - Integrate professional tab in User Profile view showing headline, skills, endorsements, work experience, education, and recommendations.
   - Provide InMail message initiation modal on user profile pages.
4. **Interface Contracts**:
   - Secure premium routes (such as InMail messaging) by verifying user status.
   - Enforce database persistence using SQLite. No mocks.

## Execution Rules
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- Verify everything via builds, lints, and E2E test runs.
