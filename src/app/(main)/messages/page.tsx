'use client';

import { useState } from 'react';
import { MessageCircle, Search, Edit, Sliders } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { useMessageStore } from '@/store/messageStore';
import { formatRelativeTime, cn } from '@/lib/utils';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import MessagingFeaturesConsole from '@/components/messaging/MessagingFeaturesConsole';

export default function MessagesPage() {
  const { conversations } = useMessageStore();
  const [query, setQuery] = useState('');
  const [showConsole, setShowConsole] = useState(false);

  const filtered = conversations.filter(c =>
    c.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.members.some(m => m.displayName.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Messages</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConsole(true)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            title="Launch Features Console"
          >
            <Sliders className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold text-primary hidden sm:inline">Launch Console</span>
          </button>
          <button className="p-2 rounded-xl hover:bg-muted transition-colors" title="New message">
            <Edit className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <Input
          placeholder="Search conversations..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-semibold">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start a conversation with someone</p>
          </div>
        ) : (
          filtered.map(conv => {
            const otherMember = conv.isGroup ? null : conv.members.find(m => m.id !== 'current');
            const displayName = conv.isGroup ? conv.name : otherMember?.displayName;
            const avatar = conv.isGroup ? conv.avatarUrl : otherMember?.avatar;
            const avatarName = displayName || 'Group';

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border/50"
              >
                {conv.isGroup ? (
                  <div className="relative h-12 w-12 flex-shrink-0">
                    {conv.members.slice(0, 4).map((m, i) => (
                      <div
                        key={m.id}
                        className="absolute h-7 w-7 rounded-full overflow-hidden border-2 border-background"
                        style={{
                          top: i < 2 ? 0 : '50%',
                          left: i % 2 === 0 ? 0 : '50%',
                          transform: i >= 2 ? 'translateY(-50%)' : undefined,
                        }}
                      >
                        <Avatar src={m.avatar} name={m.displayName} size="xs" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Avatar src={avatar} name={avatarName} size="lg" isOnline={Math.random() > 0.5} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn('text-sm font-semibold truncate', conv.unreadCount > 0 && 'text-foreground')}>
                      {displayName}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {conv.lastMessage && formatRelativeTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      'text-sm truncate',
                      conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}>
                      {conv.lastMessage?.content || 'Start a conversation'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <Modal isOpen={showConsole} onClose={() => setShowConsole(false)} title="Batch 4 Messaging Features Console" size="full">
        <MessagingFeaturesConsole />
      </Modal>
    </div>
  );
}
