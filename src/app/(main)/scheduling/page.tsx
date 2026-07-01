"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ScheduledPost {
  id: string;
  content: string;
  scheduledAt: string;
  type: string;
  visibility: string;
  author: {
    username: string;
    displayName: string;
  };
}

const TONES = [
  "Professional",
  "Casual",
  "Witty",
  "Academic",
  "Bold",
  "Helpful",
];
const PLATFORMS = ["X/Microblog", "PhotoFeed", "Professional"];

export default function SchedulingPage() {
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Brand Voice Profile Form State
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Professional");

  // AI Post Generator State
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("Professional");
  const [genTone, setGenTone] = useState("Professional");
  const [generatedCopy, setGeneratedCopy] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Queue Poster State
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Load Brand Voice Profile from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBrandName(localStorage.getItem("apaya_brandName") || "");
      setWebsiteUrl(localStorage.getItem("apaya_websiteUrl") || "");
      setAudience(localStorage.getItem("apaya_audience") || "");
      setTone(localStorage.getItem("apaya_tone") || "Professional");
    }
  }, []);

  // Fetch scheduled posts
  const fetchScheduledPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const res = await apiFetch("/api/posts?scheduled=1");
      if (res.ok) {
        const json = await res.json();
        setScheduledPosts(json.data || []);
      } else {
        toast.error("Failed to load scheduled posts");
      }
    } catch (err) {
      console.error("Error fetching scheduled posts:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  // Initialize scheduleTime when selectedDate changes
  useEffect(() => {
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(selectedDate.getDate()).padStart(2, "0");

    // Maintain current hours and minutes or fallback to 12:00
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    setScheduleTime(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  }, [selectedDate]);

  // Save Brand Profile to localStorage
  const saveBrandProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("apaya_brandName", brandName);
    localStorage.setItem("apaya_websiteUrl", websiteUrl);
    localStorage.setItem("apaya_audience", audience);
    localStorage.setItem("apaya_tone", tone);
    toast.success("Brand profile saved to local storage!");
  };

  // Generate AI copy
  const handleGenerateAI = async () => {
    if (!brandName.trim()) {
      toast.error(
        "Please configure your Brand Name in the Brand Profile first.",
      );
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please enter a topic prompt for the AI Generator.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/scheduling/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          websiteUrl,
          audience,
          tone: genTone,
          platform,
          prompt,
        }),
      });

      if (!response.ok) throw new Error("AI Content generation failed");
      const data = await response.json();
      setGeneratedCopy(data.content);
      toast.success("AI Post copy generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate content with AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Schedule Post (Queue Poster)
  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedCopy.trim()) {
      toast.error("Post content cannot be empty. Generate or type copy first.");
      return;
    }
    if (!scheduleTime) {
      toast.error("Please select a valid future date & time.");
      return;
    }

    setIsScheduling(true);
    try {
      const response = await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          content: generatedCopy,
          scheduledAt: new Date(scheduleTime).toISOString(),
          type: "TEXT",
          visibility: "PUBLIC",
        }),
      });

      if (!response.ok) throw new Error("Post scheduling failed");
      toast.success("Post successfully scheduled!");
      setGeneratedCopy("");
      fetchScheduledPosts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule post.");
    } finally {
      setIsScheduling(false);
    }
  };

  // Helper comparison
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const totalSlots = startDayOfWeek + daysInMonth <= 35 ? 35 : 42;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Prefix days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Suffix days from next month
    const nextDaysNeeded = totalSlots - days.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  const monthName = currentMonth.toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });

  const navigateMonth = (direction: "prev" | "next") => {
    const step = direction === "prev" ? -1 : 1;
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + step, 1),
    );
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Apaya Content Scheduling & Automation
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Define your Brand Voice, auto-generate high-engaging social posts
            using AI, and schedule them to your calendar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Month Calendar */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg" className="shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">{monthName}</h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="p-2 rounded-xl hover:bg-muted border border-border transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigateMonth("next")}
                  className="p-2 rounded-xl hover:bg-muted border border-border transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Days of Week Headers */}
            <div className="grid grid-cols-7 text-center font-semibold text-xs text-muted-foreground mb-3 pb-2 border-b border-border">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const isSelected = isSameDay(day.date, selectedDate);
                const isToday = isSameDay(day.date, new Date());

                // Find posts scheduled for this day
                const dayPosts = scheduledPosts.filter((p) => {
                  if (!p.scheduledAt) return false;
                  return isSameDay(new Date(p.scheduledAt), day.date);
                });

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day.date)}
                    className={cn(
                      "min-h-[85px] p-2 flex flex-col items-start justify-between rounded-xl border transition-all text-left group relative",
                      day.isCurrentMonth
                        ? "bg-card border-border hover:border-primary/50"
                        : "bg-muted/30 border-border/50 text-muted-foreground/50",
                      isSelected
                        ? "ring-2 ring-primary border-primary bg-primary/5"
                        : "",
                      isToday && !isSelected
                        ? "border-primary/40 font-bold"
                        : "",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-md font-medium",
                        isToday && !isSelected
                          ? "bg-primary/10 text-primary"
                          : "",
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-foreground",
                      )}
                    >
                      {day.date.getDate()}
                    </span>

                    {/* Small scheduled posts indicators */}
                    <div className="w-full mt-2 space-y-1">
                      {dayPosts.slice(0, 2).map((post, _pIdx) => (
                        <div
                          key={post.id}
                          className="text-[9px] font-medium leading-none px-1 py-0.5 rounded bg-primary/10 text-primary truncate w-full"
                          title={post.content}
                        >
                          {post.content}
                        </div>
                      ))}
                      {dayPosts.length > 2 && (
                        <div className="text-[8px] font-semibold text-muted-foreground text-center w-full">
                          +{dayPosts.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Scheduled Posts Details for Selected Day */}
          <Card padding="md" className="shadow-sm">
            <h3 className="font-bold text-sm text-foreground mb-4">
              Scheduled Posts for{" "}
              {selectedDate.toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </h3>

            {isLoadingPosts ? (
              <div className="flex justify-center py-6">
                <Spinner size="sm" />
              </div>
            ) : (
              (() => {
                const dayPosts = scheduledPosts.filter(
                  (p) =>
                    p.scheduledAt &&
                    isSameDay(new Date(p.scheduledAt), selectedDate),
                );
                if (dayPosts.length === 0) {
                  return (
                    <p className="text-xs text-muted-foreground py-2 italic">
                      No posts scheduled for this date. Click the &quot;Schedule
                      Post&quot; card on the right to add one.
                    </p>
                  );
                }
                return (
                  <div className="space-y-3">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-3 bg-muted/40 rounded-xl border border-border/60 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-primary">
                            @{post.author.username || "user"}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(post.scheduledAt).toLocaleTimeString(
                              undefined,
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {post.content}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </Card>
        </div>

        {/* Right Column: Configurations & Form Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Brand Voice Profile Form */}
          <Card padding="lg" className="shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Brand Voice Profile
              </h2>
            </div>
            <form onSubmit={saveBrandProfile} className="space-y-4">
              <Input
                label="Brand Name"
                placeholder="e.g. Acme Corp"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
              <Input
                label="Website URL"
                placeholder="e.g. https://acme.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
              <Input
                label="Target Audience"
                placeholder="e.g. tech entrepreneurs, marketers"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Brand Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="sm" className="w-full">
                Save Profile
              </Button>
            </form>
          </Card>

          {/* AI Post Generator */}
          <Card
            padding="lg"
            className="shadow-sm border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] via-card to-card"
          >
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">
                AI Post Generator
              </h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  What is this post about? (AI Prompt)
                </label>
                <textarea
                  placeholder="e.g. Announcing our new open-source dashboard that integrates real-time webhooks!"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Target Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Tone Selector
                  </label>
                  <select
                    value={genTone}
                    onChange={(e) => setGenTone(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <Spinner size="sm" className="border-white" />
                    Generating copy...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Queue Poster (Schedule Form) */}
          <Card padding="lg" className="shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                Schedule Post
              </h2>
            </div>
            <form onSubmit={handleSchedulePost} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Post Content
                </label>
                <textarea
                  placeholder="AI-generated post or write custom content..."
                  value={generatedCopy}
                  onChange={(e) => setGeneratedCopy(e.target.value)}
                  className="flex min-h-[140px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isScheduling}
                className="w-full flex items-center justify-center gap-2"
              >
                {isScheduling ? (
                  <>
                    <Spinner size="sm" className="border-white" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Schedule Post
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
