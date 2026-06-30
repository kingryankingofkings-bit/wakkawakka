"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRedditStore } from "@/store/redditStore";

interface RedditPostComposerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubredditId?: string;
  onPostCreated?: () => void;
}

export function RedditPostComposer({
  isOpen,
  onClose,
  defaultSubredditId,
  onPostCreated,
}: RedditPostComposerProps) {
  const { subreddits, fetchSubreddits, createPost } = useRedditStore();
  
  const [subredditId, setSubredditId] = useState(defaultSubredditId || "");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"TEXT" | "POLL" | "LINK" | "MEDIA">("TEXT");
  const [content, setContent] = useState("");
  
  // Markdown Preview Tab
  const [previewTab, setPreviewTab] = useState(false);

  // Poll fields
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // Media/Link fields
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [altText, setAltText] = useState("");

  // Flair, NSFW, Spoiler
  const [flair, setFlair] = useState("");
  const [isNSFW, setIsNSFW] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isAMA, setIsAMA] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const flairsList = ["Discussion", "Question", "Meme", "News", "OC", "Feedback"];

  useEffect(() => {
    fetchSubreddits();
  }, [fetchSubreddits]);

  useEffect(() => {
    if (defaultSubredditId) {
      setSubredditId(defaultSubredditId);
    } else if (subreddits.length > 0 && !subredditId) {
      setSubredditId(subreddits[0].id);
    }
  }, [defaultSubredditId, subreddits, subredditId]);

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!subredditId) {
      setError("Subreddit selection is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: any = {
        title,
        type,
        isNSFW,
        isSpoiler,
        isAMA,
        subredditId,
      };

      if (type === "TEXT") {
        payload.content = content;
      } else if (type === "POLL") {
        payload.content = content;
        payload.pollOptions = pollOptions.filter((o) => o.trim() !== "");
      } else if (type === "MEDIA") {
        payload.content = content;
        payload.mediaUrls = mediaUrlInput.trim() ? [mediaUrlInput.trim()] : [];
        if (altText) {
          payload.content = (content ? content + "\n\n" : "") + `[Alt: ${altText}]`;
        }
      } else if (type === "LINK") {
        payload.content = linkUrl;
      }

      if (flair) {
        payload.title = `[${flair}] ${payload.title}`;
      }

      await createPost(payload);
      
      // Reset form
      setTitle("");
      setContent("");
      setType("TEXT");
      setPollOptions(["", ""]);
      setMediaUrlInput("");
      setLinkUrl("");
      setAltText("");
      setFlair("");
      setIsNSFW(false);
      setIsSpoiler(false);
      setIsAMA(false);
      
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a Post">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            CHOOSE A COMMUNITY
          </label>
          <select
            value={subredditId}
            onChange={(e) => setSubredditId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>Select a subreddit</option>
            {subreddits.map((sub) => (
              <option key={sub.id} value={sub.id}>
                r/{sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border">
          {(["TEXT", "POLL", "MEDIA", "LINK"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-all ${
                type === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            TITLE
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="An interesting title"
            maxLength={100}
            required
          />
        </div>

        {/* Dynamic Fields */}
        {type === "TEXT" && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-muted-foreground">
                BODY (MARKDOWN SUPPORTED)
              </label>
              <button
                type="button"
                onClick={() => setPreviewTab(!previewTab)}
                className="text-xs text-primary font-semibold hover:underline"
              >
                {previewTab ? "Edit" : "Preview"}
              </button>
            </div>
            
            {previewTab ? (
              <div className="border border-input rounded-md p-3 min-h-[120px] text-sm bg-muted whitespace-pre-wrap">
                {content || <span className="italic text-muted-foreground">Nothing to preview</span>}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Post content..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}
          </div>
        )}

        {type === "POLL" && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-muted-foreground">
              POLL OPTIONS (2-5)
            </label>
            {pollOptions.map((option, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  value={option}
                  onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  required
                />
                {pollOptions.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemovePollOption(idx)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {pollOptions.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPollOption}
                className="w-full text-xs font-semibold"
              >
                + Add Option
              </Button>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 mt-3">
                POLL CONTEXT (OPTIONAL)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Details about the poll..."
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {type === "MEDIA" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                MEDIA URL (IMAGE OR VIDEO)
              </label>
              <Input
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                ALT TEXT (FOR ACCESSIBILITY)
              </label>
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe this image"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                POST CAPTION (OPTIONAL)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Caption..."
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {type === "LINK" && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              LINK URL
            </label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
              required
            />
          </div>
        )}

        {/* Flairs Selection */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            SELECT FLAIR (OPTIONAL)
          </label>
          <div className="flex flex-wrap gap-2">
            {flairsList.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFlair(flair === f ? "" : f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  flair === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Flags (NSFW, Spoiler, AMA) */}
        <div className="flex flex-wrap gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isNSFW}
              onChange={(e) => setIsNSFW(e.target.checked)}
              className="rounded border-input text-primary focus:ring-ring"
            />
            NSFW
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSpoiler}
              onChange={(e) => setIsSpoiler(e.target.checked)}
              className="rounded border-input text-primary focus:ring-ring"
            />
            SPOILER
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAMA}
              onChange={(e) => setIsAMA(e.target.checked)}
              className="rounded border-input text-primary focus:ring-ring"
            />
            AMA SESSION
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
