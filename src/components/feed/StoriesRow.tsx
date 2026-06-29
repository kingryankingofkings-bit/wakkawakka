'use client';

import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { StoryViewer } from './StoryViewer';
import { MOCK_STORIES, CURRENT_USER } from '@/lib/mockData';

export function StoriesRow() {
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stories = MOCK_STORIES;

  return (
    <>
      <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
        {/* Add story */}
        <button
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="relative h-16 w-16">
            <Avatar src={CURRENT_USER.avatar} name={CURRENT_USER.displayName} size="lg" />
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
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              toast.success('Story uploaded successfully!');
              // Clear the input so the same file can be uploaded again if needed
              e.target.value = '';
            }
          }}
        />

        {/* Stories */}
        {stories.map((story, i) => (
          <button
            key={story.id}
            onClick={() => setViewingIndex(i)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <Avatar
              src={story.author.avatar}
              name={story.author.displayName}
              size="lg"
              hasStory
              storyViewed={story.hasViewed}
            />
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap max-w-[64px] truncate">
              {story.author.displayName.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {viewingIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewingIndex}
          onClose={() => setViewingIndex(null)}
        />
      )}
    </>
  );
}
