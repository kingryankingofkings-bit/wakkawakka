"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen, Star, Clock, Trophy, Users, PlayCircle,
  ChevronLeft, CheckCircle2, Lock, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { CURRENT_USER } from "@/lib/mockData";
import toast from "react-hot-toast";

export default function CourseDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const authUser = useAuthStore((s) => s.user);
  const user = authUser || CURRENT_USER;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/courses/${id}`);
        if (res.ok) {
          const json = await res.json();
          if (active && json.data) {
            setCourse(json.data);
            // Check enrollment from enrollments list
            const myEnroll = json.data.enrollments?.find(
              (e: any) => e.userId === user.id
            );
            if (myEnroll) {
              setIsEnrolled(true);
              setProgress(myEnroll.progressPercentage || 0);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id, user.id]);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const res = await apiFetch("/api/professional/learning", {
        method: "POST",
        body: JSON.stringify({ courseId: id }),
      });
      if (res.ok) {
        setIsEnrolled(true);
        toast.success("Enrolled successfully!");
      } else {
        const json = await res.json();
        toast.error(json.error || "Enrollment failed");
      }
    } catch {
      toast.error("Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  }

  async function handleRating(rating: number) {
    if (!isEnrolled) {
      toast.error("You must be enrolled to rate this course");
      return;
    }
    setSubmittingRating(true);
    try {
      const res = await apiFetch(`/api/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "rate", rating }),
      });
      if (res.ok) {
        const json = await res.json();
        setUserRating(rating);
        setCourse((prev: any) => ({
          ...prev,
          rating: json.data.rating,
          ratingCount: json.data.ratingCount,
        }));
        toast.success("Rating submitted!");
      } else {
        const json = await res.json();
        toast.error(json.error || "Rating failed");
      }
    } catch {
      toast.error("Rating failed");
    } finally {
      setSubmittingRating(false);
    }
  }

  async function handleProgress(newProgress: number) {
    try {
      const res = await apiFetch(`/api/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "progress", progressPercentage: newProgress }),
      });
      if (res.ok) {
        setProgress(newProgress);
        if (newProgress >= 100) {
          toast.success("🎉 Course completed! Certificate issued.");
        } else {
          toast.success(`Progress updated to ${newProgress}%`);
        }
      }
    } catch {
      toast.error("Failed to update progress");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Course Not Found</h2>
        <p className="text-muted-foreground mb-4">This course may have been removed or doesn&apos;t exist.</p>
        <Link href="/learning" className="text-primary hover:underline">← Back to Learning</Link>
      </div>
    );
  }

  const displayRating = course.rating?.toFixed(1) || "0.0";
  const modules = (() => {
    try { return JSON.parse(course.modulesList || "[]"); } catch { return []; }
  })();

  return (
    <div className="max-w-3xl mx-auto min-h-screen">
      {/* Back nav */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/learning" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Learning
        </Link>
        <span className="text-border">|</span>
        <span className="text-sm font-semibold truncate">{course.title}</span>
      </div>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-primary/15 to-primary/5 p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
            {course.category}
          </span>
          <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
            <Trophy className="w-3 h-3" /> {course.level}
          </span>
          {course.isPremium && (
            <span className="text-xs font-bold bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> Premium
            </span>
          )}
        </div>

        <h1 className="text-3xl font-extrabold mb-3 leading-tight">{course.title}</h1>
        <p className="text-muted-foreground mb-6 max-w-xl">{course.description}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
              {course.instructor?.charAt(0).toUpperCase()}
            </div>
            @{course.instructor}
          </span>
          {course.durationMinutes > 0 && (
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.durationMinutes} min</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {course.enrollments?.length || 0} enrolled
          </span>
          <span className="flex items-center gap-1 text-yellow-500 font-semibold">
            <Star className="w-4 h-4 fill-yellow-500" /> {displayRating}/10
            <span className="text-muted-foreground font-normal">({course.ratingCount} ratings)</span>
          </span>
        </div>

        {/* Enroll / Progress */}
        {isEnrolled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-500">
              <CheckCircle2 className="w-4 h-4" /> Enrolled
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => handleProgress(p)}
                  disabled={progress >= p}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full font-semibold transition-colors",
                    progress >= p
                      ? "bg-primary/20 text-primary cursor-not-allowed"
                      : "bg-muted hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {p === 100 ? "Complete ✓" : `Mark ${p}%`}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <PlayCircle className="w-5 h-5" />
            {enrolling ? "Enrolling…" : course.isPremium ? "Enroll (Premium)" : "Enroll Free"}
          </button>
        )}
      </div>

      {/* Course content */}
      <div className="p-6 space-y-6">
        {/* Modules */}
        {modules.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">Course Modules</h2>
            <div className="space-y-2">
              {modules.map((mod: string, i: number) => {
                const unlocked = isEnrolled;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border transition-colors",
                      unlocked ? "border-border hover:border-primary/40 cursor-pointer" : "border-border/40 opacity-50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {unlocked ? i + 1 : <Lock className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm font-medium">{mod}</span>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Rating section */}
        {isEnrolled && (
          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-1">Rate This Course</h2>
            <p className="text-sm text-muted-foreground mb-4">Your rating helps other learners choose great content.</p>

            <div className="flex gap-1 mb-4" aria-label="Course rating">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRating(star)}
                  disabled={submittingRating || userRating > 0}
                  className={cn(
                    "w-8 h-8 rounded-full text-sm font-bold transition-all",
                    (hoverRating || userRating) >= star
                      ? "bg-yellow-500 text-black"
                      : "bg-muted text-muted-foreground hover:bg-yellow-500/30"
                  )}
                  aria-label={`Rate ${star} out of 10`}
                >
                  {star}
                </button>
              ))}
            </div>

            {userRating > 0 ? (
              <p className="text-sm text-green-500 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> You rated this course {userRating}/10
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Click a number to rate</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
