'use client';

import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, Video, Globe, Users, Lock, X, Music, Hash, AtSign, Clock, Tag, ChevronDown, Smile, BarChart2, PlusCircle, MinusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useFeedStore } from '@/store/feedStore';
import { CURRENT_USER } from '@/lib/mockData';
import { extractHashtags, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Post, Visibility } from '@/types';
import { apiFetch } from '@/lib/apiClient';

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: typeof Globe }[] = [
  { value: 'PUBLIC', label: 'Public', icon: Globe },
  { value: 'FOLLOWERS', label: 'Followers', icon: Users },
  { value: 'PRIVATE', label: 'Only me', icon: Lock },
];

const POST_TABS = ['Post', 'Reel', 'Story'] as const;

const POPULAR_EMOJIS = ['😀', '😂', '😍', '👍', '🔥', '🎉', '👏', '🙌', '✨', '❤️', '🤔', '😎', '💡', '🚀', '👀'];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [tab, setTab] = useState<'Post' | 'Reel' | 'Story'>('Post');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [showVisibility, setShowVisibility] = useState(false);
  const [previews, setPreviews] = useState<{ url: string; altText: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  
  // Poll States
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  
  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // BeReal BTS & TikTok Green Screen States
  const [btsUrl, setBtsUrl] = useState<string | null>(null);
  const [greenScreenBg, setGreenScreenBg] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addPost = useFeedStore(s => s.addPost);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviews(prev => [...prev, { url, altText: '' }]);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: tab === 'Reel' ? { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'] } : { 'image/*': [], 'video/*': [] },
    multiple: true,
  });

  const charCount = content.length;
  const charLimit = 2200;
  const hashtags = extractHashtags(content);

  const handleEmojiClick = (emoji: string) => {
    setContent(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions(prev => [...prev, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    setPollOptions(prev => prev.map((o, i) => (i === index ? val : o)));
  };

  async function handleSubmit() {
    if (!content.trim() && previews.length === 0 && !showPollCreator) return;
    setIsLoading(true);

    try {
      // Build poll if filled
      let pollData = undefined;
      const filteredOptions = pollOptions.filter(o => o.trim() !== '');
      if (showPollCreator && pollQuestion.trim() !== '' && filteredOptions.length >= 2) {
        const pollId = `poll_${Date.now()}`;
        pollData = {
          id: pollId,
          postId: `post_${Date.now()}`,
          question: pollQuestion.trim(),
          options: filteredOptions.map((opt, idx) => ({
            id: `opt_${Date.now()}_${idx}`,
            pollId,
            text: opt.trim(),
            votesCount: 0,
          })),
          allowMultiple: false,
          isClosed: false,
          userVotes: [],
        };
      }

      // Serialize media urls with optional altText
      const mediaUrls = previews.map(p => JSON.stringify({ url: p.url, altText: p.altText }));

      const payload = {
        content: content.trim(),
        mediaUrls,
        type: tab === 'Reel' ? 'REEL' : previews.length > 0 ? 'IMAGE' : 'TEXT',
        visibility,
        isEphemeral: tab === 'Story',
        expiresAt: tab === 'Story' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : undefined,
        poll: pollData,
        btsUrl: btsUrl || undefined,
        greenScreenBg: greenScreenBg || undefined,
      };

      const res = await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          addPost(json.data);
          toast.success('Post published!');
          setContent('');
          setPreviews([]);
          setShowPollCreator(false);
          setPollQuestion('');
          setPollOptions(['', '']);
          setScheduledAt(null);
          setShowScheduler(false);
          onClose();
        } else {
          toast.error('Failed to create post');
        }
      } else {
        toast.error('Failed to create post');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create post');
    } finally {
      setIsLoading(false);
    }
  }

  const VisIcon = VISIBILITY_OPTIONS.find(o => o.value === visibility)?.icon || Globe;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create" size="lg">
      <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {POST_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Author row */}
        <div className="flex items-center gap-3">
          <Avatar src={CURRENT_USER.avatar} name={CURRENT_USER.displayName} size="md" />
          <div className="relative">
            <p className="text-sm font-semibold">{CURRENT_USER.displayName}</p>
            <button
              onClick={() => setShowVisibility(!showVisibility)}
              className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md hover:bg-muted/80"
            >
              <VisIcon className="h-3 w-3" />
              {VISIBILITY_OPTIONS.find(o => o.value === visibility)?.label}
              <ChevronDown className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {showVisibility && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute left-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 py-1 min-w-36"
                >
                  {VISIBILITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setVisibility(opt.value); setShowVisibility(false); }}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors',
                        visibility === opt.value && 'text-primary'
                      )}
                    >
                      <opt.icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Text area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={
              tab === 'Story' ? "Create a story..." :
              tab === 'Reel' ? "Add a caption for your Reel..." :
              "What's on your mind?"
            }
            className="w-full min-h-[120px] resize-none bg-transparent text-foreground text-base placeholder:text-muted-foreground focus:outline-none leading-relaxed"
            maxLength={charLimit}
          />
        </div>

        {/* Char counter & Emoji Button */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex gap-2 items-center">
            {hashtags.length > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <Hash className="h-3 w-3" />
                {hashtags.slice(0, 3).join(' #')}
                {hashtags.length > 3 && `+${hashtags.length - 3}`}
              </span>
            )}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn("p-1 rounded-lg hover:bg-muted transition-colors", showEmojiPicker && "text-primary bg-muted")}
              title="Add Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>
          <span className={cn(charCount > charLimit * 0.9 && 'text-destructive')}>
            {charCount}/{charLimit}
          </span>
        </div>

        {/* Inline Emoji Picker Panel */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 p-2.5 bg-muted/50 border border-border rounded-xl">
                {POPULAR_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-lg p-1 hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Poll Creator Component */}
        <AnimatePresence>
          {showPollCreator && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border pb-2 mb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Create a Poll</h4>
                <button
                  onClick={() => setShowPollCreator(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />

              <div className="space-y-2">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={e => handlePollOptionChange(i, e.target.value)}
                      className="flex-1 h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => handleRemovePollOption(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <MinusCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 5 && (
                <button
                  onClick={handleAddPollOption}
                  className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:text-primary/80 transition-colors pt-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Option
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media previews */}
        {previews.length > 0 && (
          <div className="space-y-3">
            {previews.map((preview, i) => (
              <div key={i} className="flex gap-3 items-start bg-muted/30 border border-border p-2 rounded-xl">
                <div className="relative rounded-lg overflow-hidden h-20 w-20 bg-muted shrink-0">
                  {tab === 'Reel' || preview.url.endsWith('.mp4') || preview.url.endsWith('.webm') || (preview.url.startsWith('blob:') && preview.url.includes('video')) ? (
                    <video src={preview.url} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <img src={preview.url} alt="" className="h-full w-full object-cover" />
                  )}
                  <button
                    onClick={() => setPreviews(p => p.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Alt Text (Accessibility)</label>
                  <input
                    type="text"
                    placeholder="Describe this image/video for screen readers..."
                    value={preview.altText}
                    onChange={e => {
                      const updated = [...previews];
                      updated[i] = { ...updated[i], altText: e.target.value };
                      setPreviews(updated);
                    }}
                    className="w-full mt-1 h-8 px-2 border border-border bg-background text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dropzone */}
        {!showPollCreator && (
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex justify-center gap-4 mb-2">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop files here' : 'Drag photos/videos or click to upload'}
            </p>
          </div>
        )}

        {/* Scheduler */}
        <AnimatePresence>
          {showScheduler && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card border border-border rounded-xl p-3 space-y-2"
            >
              <div className="flex items-center justify-between border-b border-border pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Schedule Publication</span>
                <button onClick={() => setShowScheduler(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="datetime-local"
                  value={scheduledAt ? new Date(scheduledAt.getTime() - scheduledAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={e => {
                    if (e.target.value) {
                      setScheduledAt(new Date(e.target.value));
                    } else {
                      setScheduledAt(null);
                    }
                  }}
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-transparent text-sm focus:outline-none text-foreground"
                />
                {scheduledAt && (
                  <button
                    onClick={() => setScheduledAt(null)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Innovations Kit Panel */}
        <div className="border border-border bg-muted/20 p-2.5 rounded-xl space-y-2 text-xs">
          <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Innovations Kit (BTS & Green Screen)</p>
          <div className="flex gap-2">
            <button
              onClick={() => setBtsUrl(btsUrl ? null : 'https://www.w3schools.com/html/mov_bbb.mp4')}
              className={cn(
                "px-2.5 py-1 rounded-lg border border-border font-semibold transition-all active:scale-95",
                btsUrl ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              🎬 {btsUrl ? "BTS Attached" : "Attach 3s BTS snippet"}
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-semibold">Green Screen:</span>
              {['Beach Sunset', 'Cyberpunk Neon', 'Space Nebula'].map(bg => (
                <button
                  key={bg}
                  onClick={() => setGreenScreenBg(greenScreenBg === bg ? null : bg)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] border border-border transition-all active:scale-95",
                    greenScreenBg === bg ? "bg-green-500 text-white border-green-500" : "bg-card hover:bg-muted text-muted-foreground"
                  )}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => {
                setShowPollCreator(!showPollCreator);
                if (previews.length > 0) setPreviews([]);
              }}
              className={cn("p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors", showPollCreator && "text-primary bg-muted")}
              title="Add Poll"
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            {[{ icon: Hash, label: 'Tag' }, { icon: AtSign, label: 'Mention' }, { icon: Music, label: 'Music' }, { icon: Tag, label: 'Product' }, { icon: Clock, label: 'Schedule' }].map(({ icon: Icon, label }) => (
              <button
                key={label}
                title={label}
                onClick={() => {
                  if (label === 'Schedule') {
                    setShowScheduler(!showScheduler);
                  }
                }}
                className={cn(
                  "p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                  label === 'Schedule' && showScheduler && "text-primary bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!content.trim() && previews.length === 0 && !showPollCreator}
            size="sm"
          >
            {tab === 'Story' ? 'Share Story' : 'Post'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
