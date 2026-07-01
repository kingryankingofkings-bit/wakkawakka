"use client";

import { useState, useEffect, useCallback } from "react";
import { useJobStore, Job } from "@/store/professionalStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Briefcase, MapPin, DollarSign, Search, Plus, FileText, CheckCircle, Tag, Building, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function JobsPage() {
  const { jobs, loading, fetchJobs, createJob, applyToJob, myApplications, fetchMyApplications } = useJobStore();

  // Search/Filters state
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [workplaceType, setWorkplaceType] = useState("");

  // Modals state
  const [postJobOpen, setPostJobOpen] = useState(false);
  const [applyJobOpen, setApplyJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // New Job state
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDesc, setNewJobDesc] = useState("");
  const [newJobCompanySlug, setNewJobCompanySlug] = useState("");
  const [newJobLocation, setNewJobLocation] = useState("");
  const [newJobType, setNewJobType] = useState("FULL_TIME");
  const [newJobWorkplace, setNewJobWorkplace] = useState("REMOTE");
  const [newJobSalary, setNewJobSalary] = useState("");
  const [newJobRequirements, setNewJobRequirements] = useState("");

  // Apply state
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  // Active Tab
  const [activeTab, setActiveTab] = useState<"find" | "my-applications">("find");

  useEffect(() => {
    fetchJobs({ query, type, workplaceType });
  }, [query, type, workplaceType, fetchJobs]);

  const loadAppliedJobs = useCallback(async () => {
    try {
      await fetchMyApplications();
    } catch (e) {}
  }, [fetchMyApplications]);

  useEffect(() => {
    loadAppliedJobs();
  }, [activeTab, loadAppliedJobs]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle || !newJobDesc || !newJobCompanySlug) {
      toast.error("Please fill in job title, description, and company slug.");
      return;
    }

    try {
      // Find company by slug to get ID
      const res = await fetch(`/api/professional/companies?slug=${newJobCompanySlug}`);
      const data = await res.json();
      if (!res.ok || !data.data) {
        toast.error("Company not found. Please create the company page first!");
        return;
      }

      await createJob({
        companyId: data.data.id,
        title: newJobTitle,
        description: newJobDesc,
        requirements: newJobRequirements.split(",").map((s) => s.trim()),
        location: newJobLocation,
        type: newJobType,
        workplaceType: newJobWorkplace,
        salary: newJobSalary,
      });

      toast.success("Job posting created successfully!");
      setPostJobOpen(false);
      setNewJobTitle("");
      setNewJobDesc("");
      setNewJobCompanySlug("");
      setNewJobLocation("");
      setNewJobSalary("");
      setNewJobRequirements("");
      fetchJobs();
    } catch (err) {
      toast.error("Failed to post job listing.");
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      await applyToJob(selectedJob.id, resumeUrl, coverLetter);
      toast.success("Application submitted successfully!");
      
      await fetchMyApplications();

      setApplyJobOpen(false);
      setResumeUrl("");
      setCoverLetter("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-purple-600 p-6 rounded-2xl text-white space-y-2 shadow-md">
        <h1 className="text-2xl font-black">Professional Job Board</h1>
        <p className="text-sm opacity-90">Find your next career move or hire top-tier talent in our network.</p>

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="bg-white text-primary hover:bg-white/95" onClick={() => setPostJobOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Post a Job
          </Button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border" role="tablist" aria-label="Job board views">
        <button
          role="tab"
          aria-selected={activeTab === "find"}
          onClick={() => setActiveTab("find")}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
            activeTab === "find"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Find Jobs
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "my-applications"}
          onClick={() => setActiveTab("my-applications")}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
            activeTab === "my-applications"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Applications
        </button>
      </div>

      {activeTab === "find" ? (
        <div className="space-y-4">
          {/* Search Bar & Filters */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 bg-background">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                className="flex-1 bg-transparent text-sm focus:outline-none"
                placeholder="Search job title or description..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search job title or description"
              />
            </div>

            <div className="flex gap-2">
              <select
                className="flex-1 bg-background border border-border rounded-xl p-2 text-xs focus:outline-none"
                value={type}
                onChange={(e) => setType(e.target.value)}
                aria-label="Filter by job type"
              >
                <option value="">All Job Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>

              <select
                className="flex-1 bg-background border border-border rounded-xl p-2 text-xs focus:outline-none"
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value)}
                aria-label="Filter by workplace type"
              >
                <option value="">All Workplace Types</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On Site</option>
              </select>
            </div>
          </div>

          {/* Job List Feed */}
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Searching listings...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl p-6">
              No job postings match your filters.
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="bg-card border border-border p-5 rounded-xl hover:border-primary/40 transition-colors shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{job.title}</h3>
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {job.company?.name || "Company"}
                      </p>
                    </div>
                    {job.salary && (
                      <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded">
                        {job.salary}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{job.description}</p>

                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                      <MapPin className="w-3 h-3" /> {job.location || "Remote"}
                    </span>
                    <span className="bg-muted px-2 py-0.5 rounded uppercase">{job.workplaceType}</span>
                    <span className="bg-muted px-2 py-0.5 rounded uppercase">{job.type.replace("_", " ")}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    <Button size="xs" onClick={() => { setSelectedJob(job); setApplyJobOpen(true); }}>
                      Apply Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Applications Tracker tab */
        <div className="space-y-3">
          {myApplications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl p-6">
              You haven&apos;t submitted any job applications yet.
            </div>
          ) : (
            myApplications.map((app, index) => (
              <div key={index} className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">{app.job?.title || "Job Listing"}</h4>
                  <p className="text-xs text-muted-foreground">{app.job?.company?.name || "Company"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Applied on {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold uppercase text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {app.status}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Post a Job Modal */}
      {postJobOpen && (
        <Modal isOpen={postJobOpen} title="Create Job Posting" onClose={() => setPostJobOpen(false)}>
          <form onSubmit={handlePostJob} className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Job Title</label>
                <Input required value={newJobTitle} onChange={(e) => setNewJobTitle(e.target.value)} placeholder="Senior Software Engineer" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Company Slug</label>
                <Input required value={newJobCompanySlug} onChange={(e) => setNewJobCompanySlug(e.target.value)} placeholder="wakkacorp" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Job Type</label>
                <select className="w-full bg-background border border-border rounded-xl p-2.5 text-sm focus:outline-none" value={newJobType} onChange={(e) => setNewJobType(e.target.value)}>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Workplace Type</label>
                <select className="w-full bg-background border border-border rounded-xl p-2.5 text-sm focus:outline-none" value={newJobWorkplace} onChange={(e) => setNewJobWorkplace(e.target.value)}>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ON_SITE">On Site</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Location</label>
                <Input value={newJobLocation} onChange={(e) => setNewJobLocation(e.target.value)} placeholder="Remote / City, State" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Salary Range / Rate</label>
                <Input value={newJobSalary} onChange={(e) => setNewJobSalary(e.target.value)} placeholder="e.g. $130,000 - $160,000" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Requirements (comma-separated)</label>
              <Input value={newJobRequirements} onChange={(e) => setNewJobRequirements(e.target.value)} placeholder="React, Node.js, Prisma" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Job Description</label>
              <textarea
                required
                className="w-full min-h-[120px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="What responsibilities and expectations does this role require?"
                value={newJobDesc}
                onChange={(e) => setNewJobDesc(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setPostJobOpen(false)}>Cancel</Button>
              <Button type="submit">Publish Listing</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Apply to Job Modal */}
      {applyJobOpen && selectedJob && (
        <Modal isOpen={applyJobOpen} title={`Apply for ${selectedJob.title}`} onClose={() => setApplyJobOpen(false)}>
          <form onSubmit={handleApply} className="space-y-4 p-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Resume URL</label>
              <Input
                required
                type="url"
                placeholder="https://example.com/resumes/my_resume.pdf"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Cover Letter / Note</label>
              <textarea
                required
                className="w-full min-h-[150px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Explain why you are the perfect candidate for this role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setApplyJobOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Application</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
