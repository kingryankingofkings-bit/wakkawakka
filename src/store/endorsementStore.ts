'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SkillEndorsement {
  skill: string;
  count: number;
  endorsedByMe: boolean;
}

interface EndorsementState {
  /** Per-profile-user-id list of endorsed skills. */
  byUser: Record<string, SkillEndorsement[]>;
}

interface EndorsementActions {
  /** Seed a user's skills once (no-op if they already have entries). */
  ensureSeed: (userId: string, seeds: SkillEndorsement[]) => void;
  endorse: (userId: string, skill: string) => void;
  addSkill: (userId: string, skill: string) => void;
  removeSkill: (userId: string, skill: string) => void;
}

type EndorsementStore = EndorsementState & EndorsementActions;

export const useEndorsementStore = create<EndorsementStore>()(
  persist(
    (set) => ({
      byUser: {},

      ensureSeed: (userId, seeds) =>
        set((state) =>
          state.byUser[userId]
            ? state
            : { byUser: { ...state.byUser, [userId]: seeds } }
        ),

      endorse: (userId, skill) =>
        set((state) => {
          const list = state.byUser[userId] || [];
          return {
            byUser: {
              ...state.byUser,
              [userId]: list.map((s) =>
                s.skill === skill
                  ? {
                      ...s,
                      endorsedByMe: !s.endorsedByMe,
                      count: s.endorsedByMe ? s.count - 1 : s.count + 1,
                    }
                  : s
              ),
            },
          };
        }),

      addSkill: (userId, skill) =>
        set((state) => {
          const trimmed = skill.trim();
          if (!trimmed) return state;
          const list = state.byUser[userId] || [];
          if (list.some((s) => s.skill.toLowerCase() === trimmed.toLowerCase())) return state;
          return {
            byUser: {
              ...state.byUser,
              [userId]: [{ skill: trimmed, count: 1, endorsedByMe: true }, ...list],
            },
          };
        }),

      removeSkill: (userId, skill) =>
        set((state) => ({
          byUser: {
            ...state.byUser,
            [userId]: (state.byUser[userId] || []).filter((s) => s.skill !== skill),
          },
        })),
    }),
    {
      name: 'wakka-endorsements',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** Deterministic seed counts so a profile looks populated without a backend. */
export function seedSkillsFor(userId: string): SkillEndorsement[] {
  const base = ['Design', 'Photography', 'Writing', 'Community Building', 'Music'];
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  return base.map((skill) => ({
    skill,
    count: (hash(skill + userId) % 38) + 4,
    endorsedByMe: false,
  }));
}
