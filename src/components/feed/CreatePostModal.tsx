'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, Video, Globe, Users, Lock, X, Music, Hash, AtSign, Clock, Tag, ChevronDown, Smile, BarChart2, PlusCircle, MinusCircle, Sparkles, Wand2, CalendarClock, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useFeedStore } from '@/store/feedStore';
import { useComposerStore } from '@/store/composerStore';
import { CURRENT_USER } from '@/lib/mockData';
import { extractHashtags, cn } from '@/lib/utils';
import {
  generateCaptions,
  suggestHashtags,
  improveText,
  altTextStarter,
  CAPTION_TONES,
  toneLabel,
  type CaptionTone,
} from '@/lib/contentTools';
import toast from 'react-hot-toast';
import { Post, Visibility } from '@/types';

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: typeof Globe }[] = [
  { value: 'PUBLIC', label: 'Public', icon: Globe },
  { value: 'FOLLOWERS', label: 'Followers', icon: Users },
  { value: 'PRIVATE', label: 'Only me', icon: Lock },
];

const POST_TABS = ['Post', 'Reel', 'Story'] as const;

const POPULAR_EMOJIS = ['😀', '😂', '😍', '👍', '🔥', '🎉', '👏', '🙌', '✨', '❤️', '🤔', '😎', '💡', '🚀', '👀'];

/** Local datetime-local value (YYYY-MM-DDTHH:mm) offset minutes into the future. */
function defaultScheduleValue(minutesAhead = 60): string {
  const d = new Date(Date.now() + minutesAhead * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [tab, setTab] = useState<'Post' | 'Reel' | 'Story'>('Post');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [showVisibility, setShowVisibility] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [altTexts, setAltTexts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Poll States
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Wakka Assist state
  const [showAssist, setShowAssist] = useState(false);
  const [assistTone, setAssistTone] = useState<CaptionTone>('casual');
  const [captions, setCaptions] = useState<string[]>([]);

  // Schedule state
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');

  // Draft state
  const [draftSaved, setDraftSaved] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addPost = useFeedStore(s => s.addPost);
  const { draft, saveDraft, clearDraft, schedulePost, scheduledPosts } = useComposerStore();

  // Restore a saved draft when the composer opens empty.
  useEffect(() => {
    if (isOpen && draft && !content.trim() && previews.length === 0) {
      setContent(draft.content);
      setVisibility(draft.visibility);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Autosave the draft (debounced) as the user types.
  useEffect(() => {
    if (!isOpen) return;
    if (!content.trim()) return;
    const t = setTimeout(() => {
      saveDraft({ content, visibility });
      setDraftSaved(true);
    }, 800);
    return () => clearTimeout(t);
  }, [content, visibility, isOpen, saveDraft]);

  // Hide the "Draft saved" indicator shortly after it appears.
  useEffect(() => {
    if (!draftSaved) return;
    const t = setTimeout(() => setDraftSaved(false), 1500);
    return () => clearTimeout(t);
  }, [draftSaved]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviews(prev => [...prev, url]);
      setAltTexts(prev => [...prev, '']);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
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

  const removeMedia = (index: number) => {
    setPreviews(p => p.filter((_, j) => j !== index));
    setAltTexts(a => a.filter((_, j) => j !== index));
  };

  const setAltText = (index: number, val: string) => {
    setAltTexts(a => a.map((t, j) => (j === index ? val : t)));
  };

  // --- Wakka Assist actions ---
  const regenerateCaptions = () => setCaptions(generateCaptions(content, assistTone));

  const openAssist = () => {
    setShowAssist(v => {
      const next = !v;
      if (next && captions.length === 0) setCaptions(generateCaptions(content, assistTone));
      return next;
    });
  };

  const applyCaption = (caption: string) => {
    setContent(prev => (prev.trim() ? `${prev.trim()}\n\n${caption}` : caption));
    textareaRef.current?.focus();
  };

  const appendHashtags = (tags: string[]) => {
    const existing = new Set(extractHashtags(content).map(h => h.toLowerCase()));
    const toAdd = tags.filter(t => !existing.has(t.toLowerCase())).map(t => `#${t}`);
    if (toAdd.length === 0) {
      toast('All suggested tags already added');
      return;
    }
    setContent(prev => `${prev.trim()} ${toAdd.join(' ')}`.trim());
  };

  const polishText = () => {
    if (!content.trim()) {
      toast('Write something first to polish');
      return;
    }
    setContent(improveText(content));
    toast.success('Text polished');
  };

  const suggestedTags = suggestHashtags(content, 8);

  function resetComposer() {
    setContent('');
    setPreviews([]);
    setAltTexts([]);
    setShowPollCreator(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowSchedule(false);
    setScheduleAt('');
    setShowAssist(false);
    setCaptions([]);
    clearDraft();
  }

  function handleSubmit() {
    if (!content.trim() && previews.length === 0 && !showPollCreator) return;

    // Scheduling path: queue instead of publishing now.
    if (showSchedule && scheduleAt) {
      const when = new Date(scheduleAt);
      if (isNaN(when.getTime())) {
        toast.error('Pick a valid date & time');
        return;
      }
      if (when.getTime() <= Date.now()) {
        toast.error('Schedule a time in the future');
        return;
      }
      schedulePost({
        content: content.trim(),
        mediaUrls: previews,
        altTexts,
        hashtags,
        visibility,
        scheduledFor: when.toISOString(),
      });
      toast.success(`Scheduled for ${when.toLocaleString()}`);
      resetComposer();
      onClose();
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
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

      const newPost: Post = {
        id: `post_${Date.now()}`,
        content: content.trim(),
        author: CURRENT_USER,
        authorId: CURRENT_USER.id,
        mediaUrls: previews,
        type: previews.length > 0 ? 'IMAGE' : pollData ? 'TEXT' : 'TEXT', // default fallback
        visibility,
        isEphemeral: tab === 'Story',
        expiresAt: tab === 'Story' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,
        hashtags,
        collaborators: [],
        poll: pollData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addPost(newPost);
      toast.success('Post published!');
      resetComposer();
      setIsLoading(false);
      onClose();
    }, 800);
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
          {/* Draft autosave indicator */}
          <AnimatePresence>
            {draftSaved && (
              <motion.span
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="ml-auto flex items-center gap-1 text-[11px] text-green-500"
              >
                <Check className="h-3 w-3" /> Draft saved
              </motion.span>
            )}
          </AnimatePresence>
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

        {/* Wakka Assist Panel */}
        <AnimatePresence>
          {showAssist && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> Wakka Assist · on-device
                  </span>
                  <button onClick={polishText} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    <Wand2 className="h-3.5 w-3.5" /> Polish text
                  </button>
                </div>

                {/* Tone selector */}
                <div className="flex flex-wrap gap-1.5">
                  {CAPTION_TONES.map(tone => (
                    <button
                      key={tone}
                      onClick={() => { setAssistTone(tone); setCaptions(generateCaptions(content, tone)); }}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                        assistTone === tone
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card/60 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {toneLabel(tone)}
                    </button>
                  ))}
                </div>

                {/* Caption suggestions */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">Caption ideas</span>
                    <button onClick={regenerateCaptions} className="text-[11px] text-primary flex items-center gap-1 hover:underline">
                      <RefreshCw className="h-3 w-3" /> Regenerate
                    </button>
                  </div>
                  {captions.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => applyCaption(c)}
                      className="w-full text-left text-sm bg-card/70 hover:bg-card border border-border rounded-lg px-3 py-2 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Hashtag suggestions */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">Suggested hashtags</span>
                    <button onClick={() => appendHashtags(suggestedTags)} className="text-[11px] text-primary hover:underline">
                      Add all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => appendHashtags([tag])}
                        className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule Panel */}
        <AnimatePresence>
          {showSchedule && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" /> Schedule post
                  </span>
                  {scheduledPosts.length > 0 && (
                    <Link href="/scheduled" className="text-[11px] text-primary hover:underline">
                      {scheduledPosts.length} queued →
                    </Link>
                  )}
                </div>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={e => setScheduleAt(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  The post stays in your queue and publishes when you open Wakka after the scheduled time.
                </p>
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

        {/* Media previews with alt-text editors */}
        {previews.length > 0 && (
          <div className={cn('grid gap-2', previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
            {previews.map((url, i) => (
              <div key={i} className="space-y-1.5">
                <div className="relative rounded-xl overflow-hidden aspect-square bg-muted">
                  <img src={url} alt={altTexts[i] || ''} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {!altTexts[i] && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-semibold bg-yellow-500/90 text-black px-1.5 py-0.5 rounded">
                      ALT missing
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={altTexts[i] || ''}
                  onChange={e => setAltText(i, e.target.value)}
                  placeholder={altTextStarter(i)}
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label={`Alt text for image ${i + 1}`}
                />
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
              <Image className="h-6 w-6 text-muted-foreground" />
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop files here' : 'Drag photos/videos or click to upload'}
            </p>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <div className="flex-1 flex gap-1 flex-wrap">
            <button
              onClick={openAssist}
              className={cn("p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors", showAssist && "text-primary bg-primary/10")}
              title="Wakka Assist (captions, hashtags, polish)"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setShowPollCreator(!showPollCreator);
                if (previews.length > 0) { setPreviews([]); setAltTexts([]); }
              }}
              className={cn("p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors", showPollCreator && "text-primary bg-muted")}
              title="Add Poll"
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setShowSchedule(v => !v);
                if (!showSchedule && !scheduleAt) setScheduleAt(defaultScheduleValue());
              }}
              className={cn("p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors", showSchedule && "text-primary bg-primary/10")}
              title="Schedule"
            >
              <Clock className="h-4 w-4" />
            </button>
            {[{ icon: Hash, label: 'Tag' }, { icon: AtSign, label: 'Mention' }, { icon: Music, label: 'Music' }, { icon: Tag, label: 'Product' }].map(({ icon: Icon, label }) => (
              <button key={label} title={label} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
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
            {showSchedule && scheduleAt ? 'Schedule' : tab === 'Story' ? 'Share Story' : 'Post'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
