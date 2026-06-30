# Handoff Report: State & Real-Time Sync Design for Batch 8 (Professional & Jobs)

## 1. Observation
- **Socket.IO Server**: Located in `server.ts` (lines 42-249). It currently manages connection events, room-joining for standard users/conversations (lines 45-64), standard DM messaging events (lines 66-96), notifications delivery (lines 98-111), live-streaming (lines 113-149), and Batch 7 Server/Channel logic (lines 161-234). It does not contain event handlers for premium InMail messaging or custom notification triggers for jobs/endorsements.
- **Zustand State Stores**: Located in `src/store/`. The folder contains stores for auth, cart, feed, message, notification, server, and UI, but lacks stores to manage professional profiles, job postings/applications, course progress, or InMail messages.
- **Database Schema**: Located in `prisma/schema.prisma`. It currently has no models or relation tables for jobs, companies, endorsements, recommendations, learning courses, or articles.
- **Existing Hook Patterns**:
  - `src/hooks/useSocket.ts` (lines 85-132) establishes the Socket.IO connection and binds default client-side handlers (`new-message`, `notification`, `user-online`, `user-offline`).
  - `src/hooks/useNotifications.ts` (lines 7-17) bridges the UI components with `useNotificationStore` but comments that socket integration is delegated.

---

## 2. Logic Chain
- **Real-Time Notification Pipeline**: In `server.ts` (lines 98-111), the server provides a generic `send-notification` event that targets the user's specific room (`user:${userId}`). To implement real-time alerts for job applications and skill endorsements, we should:
  1. Expand the client-side `NotificationType` in `src/types/index.ts` to support professional activities (e.g., `JOB_APPLICATION`, `SKILL_ENDORSEMENT`, `RECOMMENDATION_REQUEST`).
  2. When the REST API endpoints (`/api/professional/jobs/[id]/apply` and `/api/professional/endorsements`) update the database, they will trigger a socket emit of type `send-notification` containing the structured notification payload, which the server relays to the target user.
- **InMail Delivery**: InMail is a premium chat feature that requires custom fields (e.g., `subject` and premium-credit checking). To separate InMail messaging from standard DMs and maintain robust access control, we should design dedicated socket channels. Using rooms like `inmail:${inMailConversationId}` and custom events (e.g. `send-inmail-message`, `new-inmail-message`) prevents InMail traffic from polluting standard chat listeners and allows granular validation.
- **State Store Isolation**: Since Batch 8 contains distinct business domains (Job Board, E-Learning, Premium InMail, Professional Profile elements), creating modular stores (`useJobStore`, `useLearningStore`, `useInMailStore`, `useProfessionalStore`) prevents bloated stores, simplifies testing, and conforms to the project's existing modular store architecture (e.g. separate `cartStore`, `messageStore`, `notificationStore`).
- **Hook Decoupling**: React UI pages (like `/jobs`, `/learning`, or profile page components) should not communicate directly with the Socket context or the raw Zustand stores. Custom hooks (`useJobSearch`, `useLearning`, `useInMail`) should encapsulate the store selectors, socket listeners, and side effects.

---

## 3. Caveats
- **SQLite Enum Workaround**: SQLite does not support native enums. Enums like `ApplicationStatus` (e.g., `PENDING`, `REVIEWING`, `ACCEPTED`, `REJECTED`) or `JobType` (e.g., `FULL_TIME`, `PART_TIME`, `CONTRACT`, `REMOTE`) must be declared as `String` in the Prisma models and validated programmatically in the Next.js API route layer, adhering to the project guideline at lines 19-22 of `prisma/schema.prisma`.
- **Premium Gates**: InMail routes and sockets must verify user status. The frontend stores must safely handle errors if a non-premium user attempts to initiate InMail.
- **Read-Only Context**: As Explorer 2, no actual file modifications have been executed. The proposed changes are designed to be applied by the implementer agent.

---

## 4. Conclusion

### Proposed Zustand Store Modifications

#### A. Job Board Store (`src/store/jobStore.ts`)
This store manages job search results, detailed job views, job creation, application state, and company profiles.

```typescript
import { create } from 'zustand';

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salary?: string;
  type: string; // 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'REMOTE'
  companyId: string;
  companyName: string;
  companyLogo?: string;
  authorId: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicantId: string;
  resumeUrl: string;
  coverLetter?: string;
  status: string; // 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  website?: string;
  industry: string;
  size: string;
  location: string;
  createdAt: string;
}

interface JobState {
  jobs: Job[];
  myApplications: JobApplication[];
  companies: Company[];
  activeJob: Job | null;
  activeCompany: Company | null;
  loading: boolean;
  error: string | null;
}

interface JobActions {
  fetchJobs: (filters?: { query?: string; location?: string; type?: string }) => Promise<void>;
  fetchJobById: (id: string) => Promise<void>;
  createJob: (jobData: Omit<Job, 'id' | 'createdAt' | 'companyName' | 'companyLogo'>) => Promise<void>;
  applyToJob: (jobId: string, resumeUrl: string, coverLetter?: string) => Promise<void>;
  fetchMyApplications: () => Promise<void>;
  fetchCompanyBySlug: (slug: string) => Promise<void>;
  createCompany: (companyData: Omit<Company, 'id' | 'createdAt'>) => Promise<void>;
}

export const useJobStore = create<JobState & JobActions>((set, get) => ({
  jobs: [],
  myApplications: [],
  companies: [],
  activeJob: null,
  activeCompany: null,
  loading: false,
  error: null,

  fetchJobs: async (filters) => {
    set({ loading: true, error: null });
    try {
      const searchParams = new URLSearchParams(filters as any).toString();
      const res = await fetch(`/api/professional/jobs?${searchParams}`);
      const data = await res.json();
      set({ jobs: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchJobById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/professional/jobs/${id}`);
      const data = await res.json();
      set({ activeJob: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createJob: async (jobData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/professional/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      const data = await res.json();
      set((state) => ({ jobs: [data, ...state.jobs], loading: false }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  applyToJob: async (jobId, resumeUrl, coverLetter) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/professional/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeUrl, coverLetter }),
      });
      const data = await res.json();
      set((state) => ({
        myApplications: [data, ...state.myApplications],
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchMyApplications: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/professional/jobs/applications'); // Or filter client/server
      const data = await res.json();
      set({ myApplications: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchCompanyBySlug: async (slug) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/professional/companies?slug=${slug}`);
      const data = await res.json();
      set({ activeCompany: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createCompany: async (companyData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/professional/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });
      const data = await res.json();
      set((state) => ({ companies: [data, ...state.companies], loading: false }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
```

#### B. Learning Store (`src/store/learningStore.ts`)
Tracks the course library, enrolled courses, and completion progress.

```typescript
import { create } from 'zustand';

export interface LearningCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  durationMinutes: number;
  category: string;
  thumbnailUrl?: string;
  lessons: { id: string; title: string; duration: number }[];
}

export interface LearningEnrollment {
  id: string;
  courseId: string;
  course: LearningCourse;
  progressPercent: number;
  completed: boolean;
  completedAt?: string;
}

interface LearningState {
  courses: LearningCourse[];
  enrollments: LearningEnrollment[];
  loading: boolean;
  error: string | null;
}

interface LearningActions {
  fetchCourses: () => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<void>;
  updateProgress: (courseId: string, progressPercent: number, completed: boolean) => Promise<void>;
}

export const useLearningStore = create<LearningState & LearningActions>((set) => ({
  courses: [],
  enrollments: [],
  loading: false,
  error: null,

  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/professional/learning');
      const data = await res.json();
      set({ courses: data.courses, enrollments: data.enrollments, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  enrollInCourse: async (courseId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/professional/learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const enrollment = await res.json();
      set((state) => ({
        enrollments: [enrollment, ...state.enrollments],
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateProgress: async (courseId, progressPercent, completed) => {
    try {
      const res = await fetch(`/api/professional/learning/${courseId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressPercent, completed }),
      });
      const updatedEnrollment = await res.json();
      set((state) => ({
        enrollments: state.enrollments.map((e) =>
          e.courseId === courseId ? updatedEnrollment : e
        ),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
```

#### C. InMail Store (`src/store/inMailStore.ts`)
Manages InMail premium conversation threads, messages, and typing indicators.

```typescript
import { create } from 'zustand';
import type { User } from '@/types';

export interface InMailMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  subject?: string;
  content: string;
  createdAt: string;
}

export interface InMailConversation {
  id: string;
  subject: string;
  senderId: string;
  receiverId: string;
  receiver: User;
  sender: User;
  lastMessage?: InMailMessage;
  unread: boolean;
  createdAt: string;
}

interface InMailState {
  conversations: InMailConversation[];
  activeConversationId: string | null;
  messages: Record<string, InMailMessage[]>;
  loading: boolean;
  error: string | null;
}

interface InMailActions {
  fetchConversations: () => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  sendInMail: (receiverId: string, subject: string, content: string) => Promise<void>;
  addInMailMessage: (message: InMailMessage) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
}

export const useInMailStore = create<InMailState & InMailActions>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  loading: false,
  error: null,

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/professional/inmail');
      const data = await res.json();
      set({ conversations: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  fetchMessages: async (conversationId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/professional/inmail?conversationId=${conversationId}`);
      const data = await res.json();
      set((state) => ({
        messages: { ...state.messages, [conversationId]: data },
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  sendInMail: async (receiverId, subject, content) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/professional/inmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, subject, content }),
      });
      const data = await res.json(); // returns { conversation, message }
      set((state) => {
        const hasConv = state.conversations.some((c) => c.id === data.conversation.id);
        const nextConversations = hasConv
          ? state.conversations.map((c) => c.id === data.conversation.id ? data.conversation : c)
          : [data.conversation, ...state.conversations];
        
        const existingMsgs = state.messages[data.conversation.id] || [];
        return {
          conversations: nextConversations,
          messages: {
            ...state.messages,
            [data.conversation.id]: [...existingMsgs, data.message],
          },
          activeConversationId: data.conversation.id,
          loading: false,
        };
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  addInMailMessage: (message) =>
    set((state) => {
      const existing = state.messages[message.conversationId] ?? [];
      const updatedMessages = {
        ...state.messages,
        [message.conversationId]: [...existing, message],
      };

      const conversations = state.conversations.map((c) => {
        if (c.id !== message.conversationId) return c;
        return {
          ...c,
          lastMessage: message,
          unread: true,
        };
      });

      return { messages: updatedMessages, conversations };
    }),
}));
```

#### D. Professional Features Store (`src/store/professionalStore.ts`)
Manages endorsements, recommendations, and newsletter publishing.

```typescript
import { create } from 'zustand';

export interface Endorsement {
  id: string;
  skill: string;
  endorserId: string;
  endorserName: string;
  endorserAvatar?: string;
  userId: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  text: string;
  writerId: string;
  writerName: string;
  writerAvatar?: string;
  receiverId: string;
  status: string; // 'PENDING' | 'APPROVED'
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface ProfessionalState {
  endorsements: Endorsement[];
  recommendations: Recommendation[];
  articles: Article[];
  loading: boolean;
  error: string | null;
}

interface ProfessionalActions {
  endorseSkill: (userId: string, skill: string) => Promise<void>;
  requestRecommendation: (receiverId: string, message: string) => Promise<void>;
  writeRecommendation: (receiverId: string, text: string) => Promise<void>;
  approveRecommendation: (id: string) => Promise<void>;
  fetchArticles: () => Promise<void>;
  createArticle: (title: string, content: string, coverImage?: string) => Promise<void>;
  fetchProfileMetadata: (userId: string) => Promise<void>;
}

export const useProfessionalStore = create<ProfessionalState & ProfessionalActions>((set) => ({
  endorsements: [],
  recommendations: [],
  articles: [],
  loading: false,
  error: null,

  endorseSkill: async (userId, skill) => {
    try {
      const res = await fetch('/api/professional/endorsements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skill }),
      });
      const data = await res.json();
      set((state) => ({ endorsements: [...state.endorsements, data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  requestRecommendation: async (receiverId, message) => {
    await fetch('/api/professional/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId, message, type: 'REQUEST' }),
    });
  },

  writeRecommendation: async (receiverId, text) => {
    try {
      const res = await fetch('/api/professional/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, text, type: 'WRITE' }),
      });
      const data = await res.json();
      set((state) => ({ recommendations: [data, ...state.recommendations] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  approveRecommendation: async (id) => {
    try {
      await fetch(`/api/professional/recommendations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'APPROVED' }),
      });
      set((state) => ({
        recommendations: state.recommendations.map((r) =>
          r.id === id ? { ...r, status: 'APPROVED' } : r
        ),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchArticles: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/professional/articles');
      const data = await res.json();
      set({ articles: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createArticle: async (title, content, coverImage) => {
    try {
      const res = await fetch('/api/professional/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, coverImage }),
      });
      const data = await res.json();
      set((state) => ({ articles: [data, ...state.articles] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchProfileMetadata: async (userId) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/professional/profile?userId=${userId}`);
      const data = await res.json();
      set({
        endorsements: data.endorsements,
        recommendations: data.recommendations,
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
```

---

### Socket.IO Event Handler Updates

#### A. Server-Side Socket.IO Event Handler Additions (`server.ts`)
Place these inside the `io.on("connection", ...)` block in `server.ts` alongside existing message events:

```typescript
    // =========================================================================
    // BATCH 8: PROFESSIONAL & JOBS REALTIME HANDLERS (InMail & Notifications)
    // =========================================================================

    // InMail Conversation Join/Leave
    socket.on("join-inmail-conversation", (inMailConversationId: string) => {
      socket.join(`inmail:${inMailConversationId}`);
      console.log(`Socket ${socket.id} joined InMail room inmail:${inMailConversationId}`);
    });

    socket.on("leave-inmail-conversation", (inMailConversationId: string) => {
      socket.leave(`inmail:${inMailConversationId}`);
      console.log(`Socket ${socket.id} left InMail room inmail:${inMailConversationId}`);
    });

    // Send InMail Message
    socket.on(
      "send-inmail-message",
      (data: {
        inMailConversationId: string;
        message: {
          id: string;
          senderId: string;
          subject?: string;
          content: string;
          createdAt: string;
        };
      }) => {
        // Broadcast message to all users in the specific InMail conversation room
        socket.to(`inmail:${data.inMailConversationId}`).emit("new-inmail-message", data.message);
      }
    );

    // InMail Typing Indicators
    socket.on("inmail-typing", (data: { inMailConversationId: string; userId: string }) => {
      socket.to(`inmail:${data.inMailConversationId}`).emit("inmail-typing", data);
    });

    socket.on("inmail-stop-typing", (data: { inMailConversationId: string; userId: string }) => {
      socket.to(`inmail:${data.inMailConversationId}`).emit("inmail-stop-typing", data);
    });
```

#### B. Real-Time Sync Mechanism (Notification Integration)
The standard notification pipeline utilizes the existing socket event:
```typescript
socket.emit("send-notification", { userId, notification })
```
The REST API server routes will dispatch this socket emit when actions complete:
1. **Job Application**: When `/api/professional/jobs/[id]/apply` accepts a submission, it creates a database notification for the Job Poster (`job.authorId`) and calls the socket dispatcher:
   ```typescript
   // Server-side emit to the poster
   io.to(`user:${jobPosterId}`).emit("notification", {
     id: "notif-app-123",
     type: "JOB_APPLICATION",
     actorId: applicantId,
     message: `${applicantName} applied for your job listing: ${jobTitle}`,
     link: `/jobs/applications?jobId=${jobId}`,
     createdAt: new Date().toISOString(),
   });
   ```
2. **Skill Endorsement**: When a user is endorsed at `/api/professional/endorsements`, a notification is generated and broadcast:
   ```typescript
   // Server-side emit to the endorsed user
   io.to(`user:${endorsedUserId}`).emit("notification", {
     id: "notif-end-456",
     type: "SKILL_ENDORSEMENT",
     actorId: endorserId,
     message: `${endorserName} endorsed your skill: ${skillName}`,
     link: `/profile/${endorsedUserId}?tab=skills`,
     createdAt: new Date().toISOString(),
   });
   ```
3. **InMail Notifications**: If an InMail message is sent, besides sending it inside the active InMail socket room, the server also triggers a notification if the recipient is online but not currently in the active InMail chat:
   ```typescript
   io.to(`user:${recipientId}`).emit("notification", {
     id: "notif-inmail-789",
     type: "INMAIL_RECEIVED",
     actorId: senderId,
     message: `New InMail message from ${senderName}: "${subject}"`,
     link: `/messages/inmail?convId=${conversationId}`,
     createdAt: new Date().toISOString(),
   });
   ```

---

### Custom React Hooks Design

#### 1. `useJobSearch.ts`
Designed for browsing, filtering, listing, and applying to job posts.

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useJobStore } from '@/store/jobStore';

export function useJobSearch(initialFilters = {}) {
  const { jobs, loading, error, fetchJobs, applyToJob, myApplications, fetchMyApplications } = useJobStore();
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    fetchJobs(filters);
  }, [filters, fetchJobs]);

  useEffect(() => {
    fetchMyApplications();
  }, [fetchMyApplications]);

  const updateFilters = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleApply = async (jobId: string, resumeUrl: string, coverLetter?: string) => {
    await applyToJob(jobId, resumeUrl, coverLetter);
  };

  return {
    jobs,
    loading,
    error,
    myApplications,
    applyToJob: handleApply,
    updateFilters,
    currentFilters: filters,
    refetch: () => fetchJobs(filters),
  };
}
```

#### 2. `useLearning.ts`
Provides enrollment actions and tracks video or lesson viewing progress.

```typescript
'use client';

import { useEffect } from 'react';
import { useLearningStore } from '@/store/learningStore';

export function useLearning() {
  const { courses, enrollments, loading, error, fetchCourses, enrollInCourse, updateProgress } = useLearningStore();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const getEnrollmentForCourse = (courseId: string) => {
    return enrollments.find((e) => e.courseId === courseId) || null;
  };

  const handleProgressUpdate = async (courseId: string, durationWatched: number, totalDuration: number) => {
    const percent = Math.min(100, Math.floor((durationWatched / totalDuration) * 100));
    const completed = percent >= 95; // consider course complete at 95% threshold
    await updateProgress(courseId, percent, completed);
  };

  return {
    courses,
    enrollments,
    loading,
    error,
    enroll: enrollInCourse,
    getEnrollmentForCourse,
    updateProgress: handleProgressUpdate,
  };
}
```

#### 3. `useInMail.ts`
Enables InMail messaging, listens to InMail socket event notifications, and propagates state mutations.

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useInMailStore, InMailMessage } from '@/store/inMailStore';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';

export function useInMail() {
  const { socket, isConnected } = useSocket();
  const currentUser = useAuthStore((s) => s.user);
  const {
    conversations,
    activeConversationId,
    messages,
    loading,
    error,
    fetchConversations,
    setActiveConversation,
    fetchMessages,
    sendInMail,
    addInMailMessage,
  } = useInMailStore();

  const [partnerTyping, setPartnerTyping] = useState(false);

  // Fetch initial conversations list
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages when active conversation changes and join corresponding socket room
  useEffect(() => {
    if (!activeConversationId) return;

    fetchMessages(activeConversationId);

    if (socket && isConnected) {
      socket.emit('join-inmail-conversation', activeConversationId);
    }

    return () => {
      if (socket && isConnected && activeConversationId) {
        socket.emit('leave-inmail-conversation', activeConversationId);
      }
    };
  }, [activeConversationId, socket, isConnected, fetchMessages]);

  // Bind live listener for incoming InMail messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncomingInMail = (message: InMailMessage) => {
      if (message.senderId !== currentUser?.id) {
        addInMailMessage(message);
      }
    };

    const handleTyping = (data: { inMailConversationId: string; userId: string }) => {
      if (data.inMailConversationId === activeConversationId && data.userId !== currentUser?.id) {
        setPartnerTyping(true);
      }
    };

    const handleStopTyping = (data: { inMailConversationId: string; userId: string }) => {
      if (data.inMailConversationId === activeConversationId && data.userId !== currentUser?.id) {
        setPartnerTyping(false);
      }
    };

    socket.on('new-inmail-message', handleIncomingInMail);
    socket.on('inmail-typing', handleTyping);
    socket.on('inmail-stop-typing', handleStopTyping);

    return () => {
      socket.off('new-inmail-message', handleIncomingInMail);
      socket.off('inmail-typing', handleTyping);
      socket.off('inmail-stop-typing', handleStopTyping);
    };
  }, [socket, isConnected, activeConversationId, currentUser?.id, addInMailMessage]);

  // Send message
  const handleSend = async (receiverId: string, subject: string, content: string) => {
    if (!currentUser?.isPremium) {
      throw new Error('Premium subscription required to send InMails');
    }
    await sendInMail(receiverId, subject, content);
  };

  // Broadcast typing indicators
  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!socket || !isConnected || !activeConversationId || !currentUser?.id) return;
    const event = isTyping ? 'inmail-typing' : 'inmail-stop-typing';
    socket.emit(event, {
      inMailConversationId: activeConversationId,
      userId: currentUser.id,
    });
  }, [socket, isConnected, activeConversationId, currentUser?.id]);

  const activeMessages = activeConversationId ? (messages[activeConversationId] ?? []) : [];

  return {
    conversations,
    activeConversationId,
    messages: activeMessages,
    loading,
    error,
    partnerTyping,
    setActiveConversation,
    sendInMail: handleSend,
    sendTypingStatus,
  };
}
```

---

## 5. Verification Method
1. **Zustand Actions Verification**:
   - Create a test UI wrapper at `/jobs` and trigger `createJob` or `applyToJob`. Open the browser console or React DevTools to inspect if state variables in `useJobStore` updating properly.
   - Run existing E2E runner tests:
     ```powershell
     node tests/e2e_runner.js
     ```
2. **Socket.IO Event Handlers Verification**:
   - Connect two user browser windows (e.g. User A as Premium, User B as Recipient).
   - In User A's console, trigger `socket.emit("send-inmail-message", ...)` or send an InMail via UI.
   - Verify that User B receives `new-inmail-message` event immediately without requiring refresh.
   - Endorse a skill from User A to User B. Verify User B receives a `notification` socket event with type `SKILL_ENDORSEMENT`.
