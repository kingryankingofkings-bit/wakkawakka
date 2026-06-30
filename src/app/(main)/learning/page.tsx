"use client";

import { useState, useEffect } from "react";
import { useLearningStore, LearningCourse, LearningEnrollment } from "@/store/professionalStore";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Play, CheckCircle2, Award, Clock, BookOpen, AlertCircle, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function LearningPage() {
  const { courses, enrollments, loading, fetchCourses, enrollInCourse, updateProgress } = useLearningStore();
  const [activeTab, setActiveTab] = useState<"catalog" | "my-learning">("catalog");
  const [selectedCourse, setSelectedCourse] = useState<LearningCourse | null>(null);

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
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-2xl text-white space-y-2 shadow-md">
        <h1 className="text-2xl font-black">Professional Learning</h1>
        <p className="text-sm opacity-90">Expand your skills, complete courses, and earn certifications for your profile.</p>
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
            <div className="space-y-4">
              {courses.map((course) => {
                const enrollment = enrollments.find((e) => e.courseId === course.id);

                return (
                  <div key={course.id} className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {course.category || "General"}
                        </span>
                        <h3 className="text-base font-bold text-foreground">{course.title}</h3>
                        <p className="text-xs text-muted-foreground">Instructor: {course.instructor}</p>
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

                    <div className="flex justify-end pt-2 border-t border-border">
                      {enrollment ? (
                        <Button size="xs" variant="outline" onClick={() => setActiveTab("my-learning")}>
                          Already Enrolled ({enrollment.progressPercentage}%)
                        </Button>
                      ) : (
                        <Button size="xs" onClick={() => handleEnroll(course.id)}>
                          Enroll Now
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
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
                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    {!enrollment.completed && (
                      <>
                        <Button size="xs" variant="outline" onClick={() => handleUpdateProgress(enrollment.courseId, 50)}>
                          Mark 50% Complete
                        </Button>
                        <Button size="xs" onClick={() => handleUpdateProgress(enrollment.courseId, 100)}>
                          Mark 100% Complete
                        </Button>
                      </>
                    )}
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
