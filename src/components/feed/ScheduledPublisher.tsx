'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useComposerStore, scheduledToPost } from '@/store/composerStore';
import { useFeedStore } from '@/store/feedStore';
import { CURRENT_USER } from '@/lib/mockData';

/**
 * Invisible background worker: publishes any scheduled posts whose time has
 * passed, then re-checks every 30s while the app is open. Mounted once in the
 * main layout. Implements the "publishes when you open Wakka after the
 * scheduled time" half of the Auto-Scheduling & Queue System.
 */
export function ScheduledPublisher() {
  useEffect(() => {
    function publishDue() {
      const { dueScheduled, removeScheduled } = useComposerStore.getState();
      const addPost = useFeedStore.getState().addPost;
      const due = dueScheduled();
      if (due.length === 0) return;
      for (const s of due) {
        addPost(scheduledToPost(s, CURRENT_USER));
        removeScheduled(s.id);
      }
      toast.success(`Published ${due.length} scheduled post${due.length > 1 ? 's' : ''}`);
    }

    publishDue();
    const interval = setInterval(publishDue, 30_000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
