"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Image as ImageIcon,
  Video,
  Globe,
  Users,
  Lock,
  Music,
  Hash,
  AtSign,
  Clock,
  Tag,
  ChevronDown,
  Smile,
  BarChart2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useFeedStore } from "@/store/feedStore";
import { CURRENT_USER } from "@/lib/mockData";
import { extractHashtags, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { z } from "zod";
import { Visibility } from "@/types";
import { apiFetch } from "@/lib/apiClient";

// Sub-components
import { EmojiPicker } from "./create-post/EmojiPicker";
import { PollCreator } from "./create-post/PollCreator";
import { MediaPreviews } from "./create-post/MediaPreviews";
import { PostScheduler } from "./create-post/PostScheduler";
import { InnovationsKit } from "./create-post/InnovationsKit";

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  icon: typeof Globe;
}[] = [
  { value: "PUBLIC", label: "Public", icon: Globe },
  { value: "FOLLOWERS", label: "Followers", icon: Users },
  { value: "PRIVATE", label: "Only me", icon: Lock },
];

const POST_TABS = ["Post", "Reel", "Story"] as const;

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [tab, setTab] = useState<"Post" | "Reel" | "Story">("Post");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [showVisibility, setShowVisibility] = useState(false);
  const [previews, setPreviews] = useState<{ url: string; altText: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem("postDraft");
      if (draft) setContent(draft);
    }
  }, [isOpen]);

  const [isLoading, setIsLoading] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);

  // Music States
  const [isMusicPost, setIsMusicPost] = useState(false);
  const [explicitLyrics, setExplicitLyrics] = useState(false);
  const [musicGenre, setMusicGenre] = useState("Pop");

  // Poll States
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // DailySnap BTS & ShortVideo Green Screen States
  const [btsUrl, setBtsUrl] = useState<string | null>(null);
  const [greenScreenBg, setGreenScreenBg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addPost = useFeedStore((s) => s.addPost);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, { url, altText: "" }]);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:
      tab === "Reel"
        ? { "video/mp4": [".mp4"], "video/webm": [".webm"] }
        : { "image/*": [], "video/*": [] },
    multiple: true,
  });

  const charCount = content.length;
  const charLimit = 2200;
  const hashtags = extractHashtags(content);

  const handleEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  async function handleSubmit() {
    if (!content.trim() && previews.length === 0 && !showPollCreator) {
      toast.error("Post cannot be empty.");
      return;
    }

    const postSchema = z.object({
      content: z.string().max(2200, "Post content cannot exceed 2200 characters").optional(),
      mediaCount: z.number().max(10, "Cannot upload more than 10 media files"),
    });

    const validation = postSchema.safeParse({
      content: content.trim(),
      mediaCount: previews.length,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (showPollCreator) {
      const filteredOptions = pollOptions.filter((o) => o.trim() !== "");
      if (pollQuestion.trim() === "") {
        toast.error("Poll question is required.");
        return;
      }
      if (filteredOptions.length < 2) {
        toast.error("Poll must have at least 2 options.");
        return;
      }
      if (filteredOptions.length > 4) {
        toast.error("Poll can have at most 4 options.");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Build poll if filled
      let pollData = undefined;
      const filteredOptions = pollOptions.filter((o) => o.trim() !== "");
      if (
        showPollCreator &&
        pollQuestion.trim() !== "" &&
        filteredOptions.length >= 2
      ) {
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
      const mediaUrls = previews.map((p) =>
        JSON.stringify({ url: p.url, altText: p.altText }),
      );

      const payload = {
        content: content.trim(),
        mediaUrls,
        type: isMusicPost ? "MUSIC" : tab === "Reel" ? "REEL" : previews.length > 0 ? "IMAGE" : "TEXT",
        isExplicit: isMusicPost ? explicitLyrics : undefined,
        musicGenre: isMusicPost ? musicGenre : undefined,
        visibility,
        isEphemeral: tab === "Story",
        expiresAt:
          tab === "Story"
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : undefined,
        poll: pollData,
        btsUrl: btsUrl || undefined,
        greenScreenBg: greenScreenBg || undefined,
      };

      const res = await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          addPost(json.data);
          toast.success("Post published!");
          localStorage.removeItem("postDraft");
          setContent("");
          setPreviews([]);
          setShowPollCreator(false);
          setPollQuestion("");
          setPollOptions(["", ""]);
          setScheduledAt(null);
          setShowScheduler(false);
          onClose();
        } else {
          toast.error("Failed to create post");
        }
      } else {
        toast.error("Failed to create post");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create post");
    } finally {
      setIsLoading(false);
    }
  }

  const VisIcon =
    VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.icon || Globe;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create" size="lg">
      <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {POST_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Author row */}
        <div className="flex items-center gap-3">
          <Avatar
            src={CURRENT_USER.avatar}
            name={CURRENT_USER.displayName}
            size="md"
          />
          <div className="relative">
            <p className="text-sm font-semibold">{CURRENT_USER.displayName}</p>
            <button
              onClick={() => setShowVisibility(!showVisibility)}
              className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md hover:bg-muted/80"
            >
              <VisIcon className="h-3 w-3" />
              {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label}
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
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setVisibility(opt.value);
                        setShowVisibility(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors",
                        visibility === opt.value && "text-primary",
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
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              tab === "Story"
                ? "Create a story..."
                : tab === "Reel"
                  ? "Add a caption for your Reel..."
                  : "What's on your mind?"
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
                {hashtags.slice(0, 3).join(" #")}
                {hashtags.length > 3 && `+${hashtags.length - 3}`}
              </span>
            )}
            {isMusicPost && (
              <div className="flex items-center gap-2">
                <select 
                  value={musicGenre} 
                  onChange={(e) => setMusicGenre(e.target.value)}
                  className="bg-muted border border-border rounded text-xs px-2 py-0.5 text-muted-foreground outline-none"
                >
                  <option value="Pop">Pop</option>
                  <option value="Hip-Hop">Hip-Hop</option>
                  <option value="R&B">R&B</option>
                  <option value="Rock">Rock</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Country">Country</option>
                  <option value="Classical">Classical</option>
                </select>
                <button
                  onClick={() => setExplicitLyrics(!explicitLyrics)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors",
                    explicitLyrics 
                      ? "bg-red-500 text-white border-red-500" 
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  )}
                  title="Explicit Lyrics"
                >
                  E
                </button>
              </div>
            )}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn(
                "p-1 rounded-lg hover:bg-muted transition-colors",
                showEmojiPicker && "text-primary bg-muted",
              )}
              title="Add Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>
          <span
            className={cn(charCount > charLimit * 0.9 && "text-destructive")}
          >
            {charCount}/{charLimit}
          </span>
        </div>

        <EmojiPicker show={showEmojiPicker} onEmojiSelect={handleEmojiClick} />

        <PollCreator
          show={showPollCreator}
          onClose={() => setShowPollCreator(false)}
          question={pollQuestion}
          onQuestionChange={setPollQuestion}
          options={pollOptions}
          onOptionsChange={setPollOptions}
        />

        <MediaPreviews
          previews={previews}
          onPreviewsChange={setPreviews}
          tab={tab}
        />

        {/* Dropzone */}
        {!showPollCreator && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/50",
            )}
          >
            <input {...getInputProps()} />
            <div className="flex justify-center gap-4 mb-2">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? "Drop files here"
                : "Drag photos/videos or click to upload"}
            </p>
          </div>
        )}

        <PostScheduler
          show={showScheduler}
          onClose={() => setShowScheduler(false)}
          scheduledAt={scheduledAt}
          onScheduledAtChange={setScheduledAt}
        />

        <InnovationsKit
          btsUrl={btsUrl}
          onBtsUrlChange={setBtsUrl}
          greenScreenBg={greenScreenBg}
          onGreenScreenBgChange={setGreenScreenBg}
        />

        {/* Action bar */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
            <div className="flex-1 flex gap-2">
            <button
              onClick={() => {
                setShowPollCreator(!showPollCreator);
                if (previews.length > 0) setPreviews([]);
              }}
              className={cn(
                "p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                showPollCreator && "text-primary bg-muted",
              )}
              title="Add Poll"
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            {[
              { icon: Hash, label: "Tag", action: () => { setContent(prev => prev + " #"); textareaRef.current?.focus(); } },
              { icon: AtSign, label: "Mention", action: () => { setContent(prev => prev + " @"); textareaRef.current?.focus(); } },
              { icon: Music, label: "Music", action: () => setIsMusicPost(!isMusicPost) },
              { icon: Tag, label: "Product", action: () => {} },
              { icon: Clock, label: "Schedule", action: () => setShowScheduler(!showScheduler) },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                title={label}
                onClick={action}
                className={cn(
                  "p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                  label === "Schedule" && showScheduler && "text-primary bg-muted",
                  label === "Music" && isMusicPost && "text-purple-500 bg-purple-500/10",
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Save to local storage as a draft
                if (content.trim()) {
                  localStorage.setItem("postDraft", content);
                  toast.success("Draft saved to browser");
                  onClose();
                } else {
                  toast.error("Nothing to save");
                }
              }}
              disabled={!content.trim()}
              size="sm"
            >
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={
                !content.trim() && previews.length === 0 && !showPollCreator
              }
              size="sm"
            >
              {tab === "Story" ? "Share Story" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
