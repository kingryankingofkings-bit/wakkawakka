'use client';

import { Image, Video, Radio, Smile } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { CURRENT_USER } from '@/lib/mockData';

interface CreatePostCardProps {
  onOpenModal: () => void;
}

export function CreatePostCard({ onOpenModal }: CreatePostCardProps) {
  return (
    <div className="p-4 flex items-start gap-3">
      <Avatar src={CURRENT_USER.avatar} name={CURRENT_USER.displayName} size="md" />
      <div className="flex-1">
        <button
          onClick={onOpenModal}
          className="w-full text-left rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          What's on your mind, {CURRENT_USER.displayName.split(' ')[0]}?
        </button>
        <div className="flex mt-2 gap-1">
          {[
            { icon: Image, label: 'Photo', color: 'text-green-500' },
            { icon: Video, label: 'Video', color: 'text-blue-500' },
            { icon: Radio, label: 'Live', color: 'text-red-500' },
            { icon: Smile, label: 'Feeling', color: 'text-yellow-500' },
          ].map(({ icon: Icon, label, color }) => (
            <button
              key={label}
              onClick={onOpenModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-muted transition-colors ${color}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
