import { create } from "zustand";
import type { User } from "@/types";

// =============================================================================
// Interfaces & Types
// =============================================================================

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
  size?: string;
  location?: string;
  headquarters?: string;
  createdAt: string;
  jobs?: Job[];
  _count?: {
    followers: number;
    jobs: number;
  };
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string | string[];
  location?: string;
  salary?: string;
  salaryRange?: string;
  type: string; // FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP | TEMPORARY
  workplaceType: string; // ON_SITE | HYBRID | REMOTE
  companyId: string;
  company?: Company;
  posterId: string;
  isActive: boolean;
  viewsCount: number;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  job?: Job;
  applicantId: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: string; // PENDING | REVIEWING | INTERVIEWING | OFFERED | REJECTED
  createdAt: string;
}

export interface InMailMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  subject?: string;
  content: string;
  isRead: boolean;
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

export interface LearningCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category?: string;
  duration?: string;
  durationMinutes: number;
  level?: string;
  modulesList?: string | string[];
  thumbnailUrl?: string;
  videoUrl?: string;
  isPremium: boolean;
  rating?: number;
  ratingCount?: number;
  createdAt: string;
}

export interface LearningEnrollment {
  id: string;
  courseId: string;
  course?: LearningCourse;
  userId: string;
  progressPercentage: number;
  completedModules?: string | string[];
  status: string; // ENROLLED | IN_PROGRESS | COMPLETED
  certificateUrl?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface Endorsement {
  id: string;
  skill: string;
  targetUserId: string;
  endorserId: string;
  endorser?: User;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  text: string;
  writerId: string;
  writerName: string;
  writerAvatar?: string;
  receiverId: string;
  status: string; // REQUESTED | PENDING | APPROVED | REJECTED
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

// =============================================================================
// Job Board Store (useJobStore)
// =============================================================================

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
  fetchJobs: (_filters?: { query?: string; search?: string; type?: string; workplaceType?: string }) => Promise<void>;
  fetchJobById: (_id: string) => Promise<void>;
  createJob: (_jobData: any) => Promise<void>;
  applyToJob: (_jobId: string, _resumeUrl: string, _coverLetter?: string) => Promise<void>;
  fetchMyApplications: () => Promise<void>;
  fetchCompanyBySlug: (_slug: string) => Promise<void>;
  createCompany: (_companyData: any) => Promise<void>;
}

export const useJobStore = create<JobState & JobActions>((set, _get) => ({
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
      if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");
      set({ jobs: data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchJobById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/professional/jobs/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch job details");
      set({ activeJob: data.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createJob: async (jobData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/professional/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create job");
      set((state) => ({ jobs: [data.data, ...state.jobs], loading: false }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  applyToJob: async (jobId, resumeUrl, coverLetter) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/professional/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUrl, coverLetter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply to job");
      set((state) => ({
        myApplications: [data.data, ...state.myApplications],
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchMyApplications: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/professional/jobs/applications");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch applications");
      set({ myApplications: data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchCompanyBySlug: async (slug) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/professional/companies/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch company");
      set({ activeCompany: data.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createCompany: async (companyData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/professional/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create company");
      set((state) => ({
        companies: [data.data, ...state.companies],
        activeCompany: data.data,
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));

// =============================================================================
// Learning Store (useLearningStore)
// =============================================================================

interface LearningState {
  courses: LearningCourse[];
  enrollments: LearningEnrollment[];
  loading: boolean;
  error: string | null;
}

interface LearningActions {
  fetchCourses: (_category?: string) => Promise<void>;
  enrollInCourse: (_courseId: string) => Promise<void>;
  updateProgress: (_courseId: string, _progressPercentage: number, _completedModules?: string[]) => Promise<void>;
}

export const useLearningStore = create<LearningState & LearningActions>((set) => ({
  courses: [],
  enrollments: [],
  loading: false,
  error: null,

  fetchCourses: async (category) => {
    set({ loading: true, error: null });
    try {
      const param = category ? `?category=${category}` : "";
      const res = await fetch(`/api/professional/learning${param}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch courses");
      set({
        courses: data.courses || data.data?.courses || [],
        enrollments: data.enrollments || data.data?.enrollments || [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  enrollInCourse: async (courseId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/professional/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enroll in course");
      set((state) => ({
        enrollments: [data.data, ...state.enrollments],
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateProgress: async (courseId, progressPercentage, completedModules) => {
    try {
      const res = await fetch(`/api/professional/learning/${courseId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressPercentage, completedModules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update course progress");
      set((state) => ({
        enrollments: state.enrollments.map((e) =>
          e.courseId === courseId ? data.data : e
        ),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));

// =============================================================================
// InMail Store (useInMailStore)
// =============================================================================

interface InMailState {
  conversations: InMailConversation[];
  activeConversationId: string | null;
  messages: Record<string, InMailMessage[]>;
  loading: boolean;
  error: string | null;
}

interface InMailActions {
  fetchConversations: () => Promise<void>;
  setActiveConversation: (_id: string | null) => void;
  sendInMail: (_receiverId: string, _subject: string, _content: string) => Promise<void>;
  addInMailMessage: (_message: InMailMessage) => void;
  fetchMessages: (_conversationId: string) => Promise<void>;
}

export const useInMailStore = create<InMailState & InMailActions>((set, _get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  loading: false,
  error: null,

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/professional/inmail");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch InMails");
      set({ conversations: data.data || [], loading: false });
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
      if (!res.ok) throw new Error(data.error || "Failed to fetch messages");
      set((state) => ({
        messages: { ...state.messages, [conversationId]: data.data || [] },
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  sendInMail: async (receiverId, subject, content) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/professional/inmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, subject, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send InMail");

      // data contains { data: message, conversation: conversation }
      const message = data.data;
      const conversation = data.conversation;

      set((state) => {
        const hasConv = state.conversations.some((c) => c.id === conversation.id);
        const nextConversations = hasConv
          ? state.conversations.map((c) => (c.id === conversation.id ? conversation : c))
          : [conversation, ...state.conversations];

        const existingMsgs = state.messages[conversation.id] || [];
        return {
          conversations: nextConversations,
          messages: {
            ...state.messages,
            [conversation.id]: [...existingMsgs, message],
          },
          activeConversationId: conversation.id,
          loading: false,
        };
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
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

// =============================================================================
// Professional Store (useProfessionalStore)
// =============================================================================

interface ProfessionalState {
  endorsements: Endorsement[];
  recommendations: Recommendation[];
  articles: Article[];
  loading: boolean;
  error: string | null;
}

interface ProfessionalActions {
  endorseSkill: (_targetUserId: string, _skill: string) => Promise<void>;
  requestRecommendation: (_receiverId: string, _message: string) => Promise<void>;
  writeRecommendation: (_receiverId: string, _text: string) => Promise<void>;
  approveRecommendation: (_id: string) => Promise<void>;
  fetchArticles: () => Promise<void>;
  createArticle: (_title: string, _content: string, _coverImage?: string) => Promise<void>;
  fetchProfileMetadata: (_userId: string) => Promise<void>;
}

export const useProfessionalStore = create<ProfessionalState & ProfessionalActions>((set) => ({
  endorsements: [],
  recommendations: [],
  articles: [],
  loading: false,
  error: null,

  endorseSkill: async (targetUserId, skill) => {
    try {
      const res = await fetch("/api/professional/endorsements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, skill }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set((state) => ({ endorsements: [...state.endorsements, data.data] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  requestRecommendation: async (receiverId, message) => {
    await fetch("/api/professional/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writerId: receiverId, message, type: "REQUEST" }),
    });
  },

  writeRecommendation: async (receiverId, text) => {
    try {
      const res = await fetch("/api/professional/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, text, type: "WRITE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set((state) => ({ recommendations: [data.data, ...state.recommendations] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  approveRecommendation: async (id) => {
    try {
      const res = await fetch("/api/professional/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "APPROVED" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      set((state) => ({
        recommendations: state.recommendations.map((r) =>
          r.id === id ? { ...r, status: "APPROVED" } : r
        ),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchArticles: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/professional/articles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ articles: data.data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createArticle: async (title, content, coverImage) => {
    try {
      const res = await fetch("/api/professional/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, coverImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set((state) => ({ articles: [data.data, ...state.articles] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchProfileMetadata: async (userId) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/professional/endorsements?userId=${userId}`);
      const endorsementsData = await res.json();

      const recRes = await fetch(`/api/professional/recommendations?userId=${userId}&status=APPROVED`);
      const recommendationsData = await recRes.json();

      set({
        endorsements: endorsementsData.data || [],
        recommendations: recommendationsData.data || [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
