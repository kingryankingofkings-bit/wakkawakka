"use client";

import { useState, useEffect } from "react";
import { Company, Job, useJobStore } from "@/store/professionalStore";
import { Button } from "@/components/ui/Button";
import { Building, MapPin, LinkIcon, Users, Calendar, Briefcase, FileText } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

interface CompanyPageProps {
  params: {
    slug: string;
  };
}

export default function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = params;
  const { activeCompany: company, loading, fetchCompanyBySlug } = useJobStore();
  const [activeTab, setActiveTab] = useState<"about" | "jobs">("about");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    fetchCompanyBySlug(slug);
  }, [slug, fetchCompanyBySlug]);

  useEffect(() => {
    if (company) {
      setFollowerCount(company._count?.followers || 0);
    }
  }, [company]);

  const handleFollow = () => {
    setIsFollowing((f) => !f);
    setFollowerCount((c) => (isFollowing ? c - 1 : c + 1));
    toast.success(isFollowing ? "Unfollowed company" : "Following company!");
  };

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Loading company...</div>;
  }

  if (!company) {
    return (
      <div className="text-center py-20 text-muted-foreground border border-dashed rounded-xl p-8 max-w-xl mx-auto mt-10">
        Company page not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-10 space-y-6">
      {/* Cover Banner */}
      <div className="relative w-full h-[200px] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-b-2xl overflow-hidden shadow-sm">
        {company.coverImage && (
          <Image src={company.coverImage} alt={company.name} fill className="object-cover" />
        )}
      </div>

      {/* Header Block */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm -mt-12 relative mx-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-border">
              {company.logoUrl ? (
                <Image src={company.logoUrl} alt={company.name} width={64} height={64} className="rounded-xl object-cover" />
              ) : (
                company.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold text-foreground">{company.name}</h1>
              <p className="text-xs text-muted-foreground font-semibold">{company.industry || "Technology"} • {company.location || company.headquarters || "Remote"}</p>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{followerCount} follower{followerCount !== 1 && "s"}</span>
              </div>
            </div>
          </div>

          <Button size="sm" variant={isFollowing ? "outline" : "primary"} onClick={handleFollow}>
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-border mx-4">
        <button
          onClick={() => setActiveTab("about")}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
            activeTab === "about"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          About
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
            activeTab === "jobs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Jobs ({company.jobs?.length || 0})
        </button>
      </div>

      <div className="mx-4">
        {activeTab === "about" ? (
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Overview</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{company.description || "No overview provided."}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground font-bold uppercase block">Company Size</span>
                <span className="text-foreground font-semibold">{company.size || company.companySize || "11-50 employees"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground font-bold uppercase block">Website</span>
                {company.website ? (
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5" /> Visit site
                  </a>
                ) : (
                  <span className="text-foreground font-semibold">Not provided</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Jobs Tab */
          <div className="space-y-3">
            {!company.jobs || company.jobs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl p-6 bg-card">
                No active openings for this company right now.
              </div>
            ) : (
              company.jobs.map((job: any) => (
                <div key={job.id} className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">{job.title}</h4>
                    <p className="text-xs text-muted-foreground">{job.location || "Remote"} • {job.workplaceType}</p>
                    <p className="text-[10px] text-muted-foreground">Salary: {job.salary || job.salaryRange || "Competitive"}</p>
                  </div>

                  <Button size="xs" onClick={() => toast.success("Navigate to the main Jobs tab to apply!")}>
                    View
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
