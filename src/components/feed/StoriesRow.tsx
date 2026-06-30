'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { StoryViewer } from './StoryViewer';
import { CURRENT_USER } from '@/lib/mockData';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/apiClient';
import { Story } from '@/types';

export function StoriesRow() {
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = useAuthStore(s => s.user);

  const activeUser = currentUser || CURRENT_USER;

  const loadStories = async () => {
    try {
      const response = await apiFetch('/api/stories');
      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          setStories(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  // Group stories by author
  const groupedAuthorsMap: { [authorId: string]: { author: any; stories: Story[]; hasUnviewed: boolean } } = {};
  stories.forEach(story => {
    const authId = story.author.id;
    if (!groupedAuthorsMap[authId]) {
      groupedAuthorsMap[authId] = {
        author: story.author,
        stories: [],
        hasUnviewed: false,
      };
    }
    groupedAuthorsMap[authId].stories.push(story);
    if (!story.hasViewed) {
      groupedAuthorsMap[authId].hasUnviewed = true;
    }
  });

  const groupedAuthors = Object.values(groupedAuthorsMap);

  const handleAuthorClick = (authorId: string) => {
    const authorGroup = groupedAuthorsMap[authorId];
    if (!authorGroup) return;
    const firstUnviewed = authorGroup.stories.find(s => !s.hasViewed) || authorGroup.stories[0];
    const indexInFlatList = stories.findIndex(s => s.id === firstUnviewed.id);
    if (indexInFlatList !== -1) {
      setViewingIndex(indexInFlatList);
    }
  };

  return (
    <>
      <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* Add story */}
        <button
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="relative h-16 w-16">
            <Avatar src={activeUser.avatar} name={activeUser.displayName} size="lg" />
            <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background">
              <Plus className="h-3 w-3" />
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Your story</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/*"
          onChange={async (e) => {
            if (e.target.files && e.target.files.length > 0) {
              const file = e.target.files[0];
              const url = URL.createObjectURL(file);
              const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
              try {
                const response = await apiFetch('/api/stories', {
                  method: 'POST',
                  body: JSON.stringify({
                    mediaUrl: url,
                    type,
                  }),
                });
                if (response.ok) {
                  toast.success('Story uploaded successfully!');
                  loadStories();
                } else {
                  toast.error('Failed to upload story');
                }
              } catch (err) {
                console.error(err);
                toast.error('Failed to upload story');
              }
              e.target.value = '';
            }
          }}
        />

        {/* Stories */}
        {groupedAuthors.map((group) => (
          <button
            key={group.author.id}
            onClick={() => handleAuthorClick(group.author.id)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <Avatar
              src={group.author.avatar}
              name={group.author.displayName}
              size="lg"
              hasStory={true}
              storyViewed={!group.hasUnviewed}
            />
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap max-w-[64px] truncate">
              {group.author.displayName.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {viewingIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewingIndex}
          onClose={() => {
            setViewingIndex(null);
            loadStories(); // reload to get updated view states
          }}
        />
      )}
    </>
  );
}
