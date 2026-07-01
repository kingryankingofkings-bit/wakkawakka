"use client";

import { useState, useEffect } from "react";
import { useLearningStore, LearningCourse, LearningEnrollment } from "@/store/professionalStore";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Play, CheckCircle2, Award, Clock, BookOpen, AlertCircle, FileText, Lock, Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { CURRENT_USER } from "@/lib/mockData";
import toast from "react-hot-toast";
import Link from "next/link";

import { ProfessionalUpgradeModal } from "@/components/profile/professional-tab/modals/ProfessionalUpgradeModal";

export default function LearningPage() {
  const { courses, enrollments, loading, fetchCourses, enrollInCourse, updateProgress } = useLearningStore();
  const [activeTab, setActiveTab] = useState<"catalog" | "my-learning">("catalog");
  const [selectedCourse, setSelectedCourse] = useState<LearningCourse | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const authUser = useAuthStore((s) => s.user);
  const user = authUser || CURRENT_USER;
  const isVerified = user.isVerified; // Authentic 'W'
  
  // Mocking usage and age for demo
  const accountAgeMonths = (user as any).accountAgeMonths || 4; // Mocking < 6 months
  const tier = user.professionalTier || "NONE";
  const freeUsage = user.freeCoursesCreatedThisMonth || 0;
  const paidUsage = user.paidCoursesCreatedThisMonth || 0;

  // Determine limits based on tier
  const freeLimit = tier === "NONE" ? 0 : tier === "SIMPLE" ? 10 : tier === "BETTER" ? 15 : Infinity;
  const paidLimit = tier === "NONE" ? 0 : tier === "SIMPLE" ? 5 : tier === "BETTER" ? 10 : tier === "BEST" ? 20 : Infinity;
  
  const waitPeriod = tier === "PURE" ? 3 : 6;
  const hasMetWaitPeriod = accountAgeMonths >= waitPeriod;

  const canUploadFree = isVerified && freeUsage < freeLimit;
  const canUploadPaid = isVerified && hasMetWaitPeriod && paidUsage < paidLimit;

  const freeCourses = courses.filter((c) => !c.isPremium);
  const paidCourses = courses.filter((c) => c.isPremium);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollInCourse(courseId);
      toast.success("Enrolled in course successfully!");
      fetchCourses(); // refresh enrollments
    } catch (err) {
      toast.error("Failed to enroll in course.");
    }
  };

  const handleUpdateProgress = async (courseId: string, percentage: number) => {
    try {
      await updateProgress(courseId, percentage);
      toast.success(`Progress updated to ${percentage}%!`);
      if (percentage >= 100) {
        toast.success("Congratulations! Certification badge issued!");
      }
      fetchCourses(); // refresh enrollments
    } catch (err) {
      toast.error("Failed to update progress.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {showUpgradeModal && <ProfessionalUpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-2xl text-white space-y-2 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-black">Professional Learning</h1>
            <p className="text-sm opacity-90 max-w-sm">Expand your skills, complete courses, and earn certifications for your profile.</p>
            
            {tier !== "NONE" && (
              <div className="pt-2 text-xs font-bold bg-black/10 inline-block px-2 py-1 rounded">
                Tier: {tier} | Free Usage: {freeUsage}/{freeLimit === Infinity ? "∞" : freeLimit} | Paid Usage: {paidUsage}/{paidLimit === Infinity ? "∞" : paidLimit}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {tier === "NONE" || !isVerified ? (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 border-none w-full shadow-lg"
              >
                <Award className="w-4 h-4" />
                Upgrade to Professional
              </Button>
            ) : null}

            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => {
                if (!isVerified) {
                  toast.error("You must be an authenticated professional (Verified 'W') to upload free courses.");
                } else if (freeUsage >= freeLimit) {
                  toast.error(`You have reached your free course limit (${freeLimit}) for this month.`);
                  setShowUpgradeModal(true);
                } else {
                  toast.success("Opening free course creator...");
                }
              }}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white border-none justify-start w-full"
              title={!canUploadFree ? "Requires Verified Profile & Available Quota" : "Upload Free Course"}
            >
              {canUploadFree ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Upload Free Course
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => {
                if (!isVerified) {
                  toast.error("You must be an authenticated professional (Verified 'W') to upload paid courses.");
                } else if (!hasMetWaitPeriod) {
                  toast.error(`You need an account age of ${waitPeriod}+ months to upload paid courses. (Current: ${accountAgeMonths} months)`);
                } else if (paidUsage >= paidLimit) {
                  toast.error(`You have reached your paid course limit (${paidLimit}) for this month.`);
                  setShowUpgradeModal(true);
                } else {
                  toast.success("Opening paid course creator...");
                }
              }}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white border-none justify-start w-full"
              title={!canUploadPaid ? `Requires ${waitPeriod} months account age, Verified Profile, & Quota` : "Upload Paid Course"}
            >
              {canUploadPaid ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Upload Paid Course
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border" role="tablist" aria-label="Learning center tabs">
        <button
          role="tab"
          aria-selected={activeTab === "catalog"}
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
            activeTab === "catalog"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Browse Catalog
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "my-learning"}
          onClick={() => setActiveTab("my-learning")}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
            activeTab === "my-learning"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Learning Progress
        </button>
      </div>

      {activeTab === "catalog" ? (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading course catalog...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl p-6">
              No courses available right now.
            </div>
          ) : (
            <div className="space-y-8">
              {/* Free Courses Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg font-bold">Free Courses</h2>
                </div>
                {freeCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No free courses available.</p>
                ) : (
                  <div className="space-y-4">
                    {freeCourses.map((course) => (
                      <CourseCard key={course.id} course={course} enrollments={enrollments} handleEnroll={handleEnroll} setActiveTab={setActiveTab} />
                    ))}
                  </div>
                )}
              </div>

              {/* Paid Courses Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold">Premium Courses</h2>
                </div>
                {paidCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No premium courses available.</p>
                ) : (
                  <div className="space-y-4">
                    {paidCourses.map((course) => (
                      <CourseCard key={course.id} course={course} enrollments={enrollments} handleEnroll={handleEnroll} setActiveTab={setActiveTab} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* My Learning / Progress Tracking tab */
        <div className="space-y-4">
          {enrollments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl p-6 bg-card">
              You haven&apos;t enrolled in any courses yet. Go to Browse Catalog to start!
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">{enrollment.course?.title}</h4>
                      <p className="text-xs text-muted-foreground">Instructor: {enrollment.course?.instructor}</p>
                    </div>

                    {enrollment.completed ? (
                      <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-500/10 px-2 py-1 rounded">
                        IN PROGRESS
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>Progress</span>
                      <span>{enrollment.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${enrollment.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {enrollment.certificateUrl && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl p-3 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Certificate issued!</span>
                      </div>
                      <a href={enrollment.certificateUrl} target="_blank" rel="noreferrer" className="font-bold underline hover:text-emerald-800">
                        View Certificate
                      </a>
                    </div>
                  )}

                  {/* Manual mock actions to update progress for demo/test validation */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> Rate:
                      </span>
                      {[1, 5, 8, 10].map((r) => (
                        <button 
                          key={r} 
                          onClick={() => toast.success(`You rated this course ${r}/10! (This updates the creator's profile rating)`)} 
                          className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2 py-1 rounded hover:bg-amber-500/20 transition-colors"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {!enrollment.completed && (
                        <>
                          <Button size="xs" variant="outline" onClick={() => handleUpdateProgress(enrollment.courseId, 50)}>
                            Mark 50%
                          </Button>
                          <Button size="xs" onClick={() => handleUpdateProgress(enrollment.courseId, 100)}>
                            Mark 100%
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, enrollments, handleEnroll, setActiveTab }: { course: LearningCourse, enrollments: LearningEnrollment[], handleEnroll: (id: string) => void, setActiveTab: (tab: any) => void }) {
  const enrollment = enrollments.find((e) => e.courseId === course.id);
  const [showWarning, setShowWarning] = useState(false);

  const confirmEnrollment = () => {
    setShowWarning(false);
    handleEnroll(course.id);
  };

  const onEnrollClick = () => {
    if (!course.isPremium) {
      setShowWarning(true);
    } else {
      handleEnroll(course.id);
    }
  };

  return (
    <div key={course.id} className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
            {course.category || "General"}
          </span>
          <h3 className="text-base font-bold text-foreground">{course.title}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Instructor: {course.instructor}
            {course.rating !== undefined && (
              <span className="font-bold text-amber-500">[{course.rating.toFixed(1)}/10]</span>
            )}
          </p>
        </div>
        {course.isPremium && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-0.5">
            <Award className="w-3 h-3" /> PREMIUM
          </span>
        )}
      </div>

      <p className="text-xs text-foreground/80 leading-relaxed">{course.description}</p>

      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> {course.duration || `${course.durationMinutes} mins`}
        </span>
        <span className="uppercase">{course.level || "Beginner"}</span>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Link
          href={`/learning/${course.id}`}
          className="text-xs font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
        >
          View Course →
        </Link>
        {enrollment ? (
          <Button size="xs" variant="outline" onClick={() => setActiveTab("my-learning")}>
            Already Enrolled ({enrollment.progressPercentage}%)
          </Button>
        ) : (
          <Button size="xs" onClick={onEnrollClick}>
            Enroll Now
          </Button>
        )}
      </div>

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold">Content Warning</h3>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Unless you know the creator knows what they are teaching, please be careful of false information. Anyone can make free courses!
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button size="sm" variant="outline" onClick={() => setShowWarning(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={confirmEnrollment}>
                Proceed & Enroll
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
