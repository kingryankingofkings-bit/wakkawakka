'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { Mic, MicOff, Hand, LogOut, Users, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCount, cn } from '@/lib/utils';
import { MOCK_AUDIO_ROOMS, MOCK_USERS } from '@/lib/mockData';
import { AudioRoom } from '@/types';
import { useSearchParams } from 'next/navigation';

function SpeakerAvatar({ user, isSpeaking }: { user: typeof MOCK_USERS[0]; isSpeaking: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative rounded-full transition-all', isSpeaking && 'ring-4 ring-primary ring-offset-2 ring-offset-background')}>
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
        <Avatar src={user.avatar} name={user.displayName} size="lg" />
        {isSpeaking && (
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
            <Mic className="h-2.5 w-2.5 text-white" />
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-center max-w-[60px] truncate">{user.displayName.split(' ')[0]}</span>
    </div>
  );
}

export default function AudioRoomsPage() {
  return (
    <Suspense>
      <AudioRoomsInner />
    </Suspense>
  );
}

function AudioRoomsInner() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const [activeRoom, setActiveRoom] = useState<AudioRoom | null>(
    roomId ? MOCK_AUDIO_ROOMS.find(r => r.id === roomId) || null : null
  );
  const [isMuted, setIsMuted] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [speakingUserId, setSpeakingUserId] = useState<string>(MOCK_AUDIO_ROOMS[0]?.speakers[0]?.id || '');

  // Cycle through speakers "speaking"
  useEffect(() => {
    if (!activeRoom) return;
    const interval = setInterval(() => {
      const speakers = activeRoom.speakers;
      if (speakers.length === 0) return;
      setSpeakingUserId(speakers[Math.floor(Math.random() * speakers.length)].id);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeRoom]);

  if (activeRoom) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Room header */}
        <div className="px-4 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold">{activeRoom.title}</h1>
              {activeRoom.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{activeRoom.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Live · {formatCount(activeRoom.listenerCount)} listening</span>
              </div>
            </div>
            <button
              onClick={() => setActiveRoom(null)}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground"
              title="Leave room"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Speakers */}
        <div className="flex-1 overflow-y-auto p-5">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Speakers ({activeRoom.speakers.length})
            </h2>
            <div className="flex flex-wrap gap-6">
              {activeRoom.speakers.map(speaker => (
                <SpeakerAvatar key={speaker.id} user={speaker} isSpeaking={speakingUserId === speaker.id} />
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Listeners ({activeRoom.listenerCount})
            </h2>
            <div className="flex flex-wrap gap-3">
              {activeRoom.listeners.map(listener => (
                <div key={listener.id} className="flex flex-col items-center gap-1">
                  <Avatar src={listener.avatar} name={listener.displayName} size="sm" />
                  <span className="text-xs text-muted-foreground truncate max-w-[48px]">
                    {listener.displayName.split(' ')[0]}
                  </span>
                </div>
              ))}
              {/* Ghost listeners */}
              {Array.from({ length: Math.min(activeRoom.listenerCount - activeRoom.listeners.length, 12) }).map((_, i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="border-t border-border px-4 py-5 flex items-center justify-around">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              'flex flex-col items-center gap-1.5 transition-colors',
              isMuted ? 'text-muted-foreground' : 'text-primary'
            )}
          >
            <div className={cn('h-14 w-14 rounded-full flex items-center justify-center', isMuted ? 'bg-muted' : 'bg-primary')}>
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6 text-white" />}
            </div>
            <span className="text-xs font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            onClick={() => setHandRaised(!handRaised)}
            className={cn('flex flex-col items-center gap-1.5', handRaised ? 'text-yellow-500' : 'text-muted-foreground')}
          >
            <div className={cn('h-14 w-14 rounded-full flex items-center justify-center', handRaised ? 'bg-yellow-500/20' : 'bg-muted')}>
              <Hand className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
          </button>

          <button
            onClick={() => setActiveRoom(null)}
            className="flex flex-col items-center gap-1.5 text-destructive"
          >
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <LogOut className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">Leave</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Audio Rooms</h1>
        <Button size="sm" onClick={() => alert('Create room coming soon!')}>
          <Plus className="h-4 w-4" />
          Create Room
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {MOCK_AUDIO_ROOMS.filter(r => r.isActive).length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Mic className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-semibold">No active rooms</p>
            <p className="text-sm text-muted-foreground mt-1">Create a room to start talking</p>
          </div>
        ) : (
          MOCK_AUDIO_ROOMS.filter(r => r.isActive).map(room => (
            <Card key={room.id} padding="md" hover onClick={() => setActiveRoom(room)}>
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                  <Mic className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{room.title}</p>
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Live</span>
                  </div>
                  {room.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{room.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex -space-x-2">
                      {room.speakers.slice(0, 4).map(s => (
                        <Avatar key={s.id} src={s.avatar} name={s.displayName} size="xs" className="ring-1 ring-background" />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {room.speakers.length} speaking · {formatCount(room.listenerCount)} listening
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
