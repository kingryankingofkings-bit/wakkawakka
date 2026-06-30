"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProfessionalStore, useInMailStore } from "@/store/professionalStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Briefcase, GraduationCap, Award, MessageSquare, Send, Plus, X, Star, Sparkles, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface ProfessionalTabProps {
  profileUserId: string;
  isOwnProfile: boolean;
}

export function ProfessionalTab({ profileUserId, isOwnProfile }: ProfessionalTabProps) {
  const authUser = useAuthStore((s) => s.user);
  
  // Stores
  const {
    endorsements,
    recommendations,
    endorseSkill,
    requestRecommendation,
    writeRecommendation,
    approveRecommendation,
    fetchProfileMetadata
  } = useProfessionalStore();

  const { sendInMail } = useInMailStore();

  // Profile data state
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [headline, setHeadline] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [expCompany, setExpCompany] = useState("");
  const [expRole, setExpRole] = useState("");
  const [expStartDate, setExpStartDate] = useState("");
  const [expEndDate, setExpEndDate] = useState("");
  const [expDescription, setExpDescription] = useState("");

  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [eduSchool, setEduSchool] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduStartDate, setEduStartDate] = useState("");
  const [eduEndDate, setEduEndDate] = useState("");

  // InMail state
  const [inMailOpen, setInMailOpen] = useState(false);
  const [inMailSubject, setInMailSubject] = useState("");
  const [inMailBody, setInMailBody] = useState("");
  const [inMailSending, setInMailSending] = useState(false);

  // Recommendations writing state
  const [writeRecOpen, setWriteRecOpen] = useState(false);
  const [recText, setRecText] = useState("");
  const [recRelationship, setRecRelationship] = useState("");

  // Recommendations requesting state
  const [requestRecOpen, setRequestRecOpen] = useState(false);
  const [reqMessage, setReqMessage] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/professional/profile?userId=${profileUserId}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.data);
        setHeadline(data.data.headline || "");
        setSkills(data.data.skills || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchProfileMetadata(profileUserId);
  }, [profileUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/professional/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          skills,
          workHistory: profileData?.workHistory || [],
          education: profileData?.education || [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.data);
        setEditProfileOpen(false);
        toast.success("Profile headline & skills updated!");
      } else {
        toast.error("Failed to update profile details");
      }
    } catch (err) {
      toast.error("Error updating profile");
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCompany || !expRole || !expStartDate) {
      toast.error("Please fill in company, role, and start date.");
      return;
    }

    const newExp = {
      company: expCompany,
      role: expRole,
      startDate: expStartDate,
      endDate: expEndDate || "Present",
      description: expDescription,
    };

    const updatedWorkHistory = [...(profileData?.workHistory || []), newExp];

    try {
      const res = await fetch("/api/professional/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: profileData?.headline,
          skills: profileData?.skills,
          workHistory: updatedWorkHistory,
          education: profileData?.education || [],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.data);
        setExperienceModalOpen(false);
        setExpCompany("");
        setExpRole("");
        setExpStartDate("");
        setExpEndDate("");
        setExpDescription("");
        toast.success("Work experience added!");
      }
    } catch (err) {
      toast.error("Error adding work experience");
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduSchool || !eduDegree || !eduStartDate) {
      toast.error("Please fill in school, degree, and start date.");
      return;
    }

    const newEdu = {
      school: eduSchool,
      degree: eduDegree,
      startDate: eduStartDate,
      endDate: eduEndDate || "Present",
    };

    const updatedEducation = [...(profileData?.education || []), newEdu];

    try {
      const res = await fetch("/api/professional/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: profileData?.headline,
          skills: profileData?.skills,
          workHistory: profileData?.workHistory || [],
          education: updatedEducation,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.data);
        setEducationModalOpen(false);
        setEduSchool("");
        setEduDegree("");
        setEduStartDate("");
        setEduEndDate("");
        toast.success("Education added!");
      }
    } catch (err) {
      toast.error("Error adding education");
    }
  };

  const handleSendInMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inMailSubject || !inMailBody) {
      toast.error("Please enter a subject and message content.");
      return;
    }

    if (!authUser?.isPremium) {
      toast.error("Premium subscription required to send InMail messages.");
      return;
    }

    try {
      setInMailSending(true);
      await sendInMail(profileUserId, inMailSubject, inMailBody);
      toast.success("InMail sent successfully!");
      setInMailOpen(false);
      setInMailSubject("");
      setInMailBody("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send InMail.");
    } finally {
      setInMailSending(false);
    }
  };

  const handleWriteRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recText) {
      toast.error("Please enter recommendation text.");
      return;
    }
    try {
      await writeRecommendation(profileUserId, recText);
      toast.success("Recommendation submitted! Waiting for receiver approval.");
      setWriteRecOpen(false);
      setRecText("");
    } catch (err) {
      toast.error("Failed to write recommendation.");
    }
  };

  const handleRequestRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestRecommendation(profileUserId, reqMessage);
      toast.success("Recommendation request sent!");
      setRequestRecOpen(false);
      setReqMessage("");
    } catch (err) {
      toast.error("Failed to request recommendation.");
    }
  };

  const handleApproveRec = async (id: string) => {
    try {
      await approveRecommendation(id);
      toast.success("Recommendation approved and displayed on profile!");
    } catch (err) {
      toast.error("Failed to approve recommendation.");
    }
  };

  const addSkillTag = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      toast.error("Skill already exists");
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
  };

  const removeSkillTag = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Loading professional details...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Profile Headline Banner */}
      <div className="bg-card border border-border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Professional Profile</h2>
            <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
          <p className="text-sm font-medium text-primary">
            {profileData?.headline || "No professional headline set yet."}
          </p>
        </div>

        <div className="flex gap-2">
          {isOwnProfile ? (
            <Button size="sm" onClick={() => setEditProfileOpen(true)}>
              Edit Headline & Skills
            </Button>
          ) : (
            <>
              {authUser?.isPremium ? (
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setInMailOpen(true)}>
                  Send InMail
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="opacity-70 cursor-not-allowed" title="Premium Required" onClick={() => toast.error("InMail requires Premium subscription!")}>
                  Send InMail (Premium)
                </Button>
              )}

              <Button size="sm" variant="outline" onClick={() => setWriteRecOpen(true)}>
                Recommend
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Work History */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Experience</h3>
          </div>
          {isOwnProfile && (
            <Button size="xs" variant="ghost" className="flex items-center gap-1 text-primary" onClick={() => setExperienceModalOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          )}
        </div>

        {(!profileData?.workHistory || JSON.parse(JSON.stringify(profileData.workHistory)).length === 0) ? (
          <p className="text-sm text-muted-foreground">No experience details added yet.</p>
        ) : (
          <div className="space-y-4 border-l border-border pl-4 ml-2">
            {profileData.workHistory.map((job: any, index: number) => (
              <div key={index} className="relative space-y-1">
                <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                <h4 className="text-sm font-bold text-foreground">{job.role}</h4>
                <p className="text-xs font-semibold text-muted-foreground">{job.company}</p>
                <p className="text-[11px] text-muted-foreground">{job.startDate} – {job.endDate || "Present"}</p>
                {job.description && (
                  <p className="text-xs text-foreground/80 pt-1 leading-relaxed">{job.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Education</h3>
          </div>
          {isOwnProfile && (
            <Button size="xs" variant="ghost" className="flex items-center gap-1 text-primary" onClick={() => setEducationModalOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          )}
        </div>

        {(!profileData?.education || JSON.parse(JSON.stringify(profileData.education)).length === 0) ? (
          <p className="text-sm text-muted-foreground">No education details added yet.</p>
        ) : (
          <div className="space-y-4 border-l border-border pl-4 ml-2">
            {profileData.education.map((edu: any, index: number) => (
              <div key={index} className="relative space-y-0.5">
                <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                <h4 className="text-sm font-bold text-foreground">{edu.school}</h4>
                <p className="text-xs font-semibold text-muted-foreground">{edu.degree}</p>
                <p className="text-[11px] text-muted-foreground">{edu.startDate} – {edu.endDate || "Present"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills & Endorsements */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">Skills & Endorsements</h3>
        </div>

        {(!profileData?.skills || profileData.skills.length === 0) ? (
          <p className="text-sm text-muted-foreground">No skills listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profileData.skills.map((skill: string, index: number) => {
              const skillEndorsementList = endorsements.filter((e) => e.skill.toLowerCase() === skill.toLowerCase());
              const count = skillEndorsementList.length;
              const hasEndorsed = skillEndorsementList.some((e) => e.endorserId === authUser?.id);

              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground">{skill}</span>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span>{count} endorsement{count !== 1 && "s"}</span>
                    </div>
                  </div>

                  {!isOwnProfile && (
                    <Button
                      size="xs"
                      variant={hasEndorsed ? "outline" : "primary"}
                      onClick={() => endorseSkill(profileUserId, skill).then(() => fetchProfile())}
                    >
                      {hasEndorsed ? "Endorsed" : "Endorse"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Recommendations</h3>
          </div>
          {!isOwnProfile && (
            <Button size="xs" variant="ghost" className="flex items-center gap-1 text-primary" onClick={() => setRequestRecOpen(true)}>
              Request
            </Button>
          )}
        </div>

        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recommendations received yet.</p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec: any, index: number) => (
              <div key={index} className="p-4 rounded-xl border border-border bg-background/50 space-y-2 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{rec.writerName}</h4>
                    <p className="text-[10px] text-muted-foreground">Recommendation</p>
                  </div>
                  {isOwnProfile && rec.status === "PENDING" && (
                    <Button size="xs" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleApproveRec(rec.id)}>
                      Approve
                    </Button>
                  )}
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed italic">&quot;{rec.text}&quot;</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Headline & Skills Modal */}
      {editProfileOpen && (
        <Modal isOpen={editProfileOpen} title="Edit Professional Info" onClose={() => setEditProfileOpen(false)}>
          <form onSubmit={handleUpdateProfile} className="space-y-4 p-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Headline</label>
              <Input
                placeholder="e.g. Lead Architect at WakkaCorp"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Skills</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. TypeScript"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkillTag(); } }}
                />
                <Button type="button" onClick={addSkillTag}>Add</Button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    <span>{skill}</span>
                    <button type="button" onClick={() => removeSkillTag(i)}>
                      <X className="w-3.5 h-3.5 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Experience Modal */}
      {experienceModalOpen && (
        <Modal isOpen={experienceModalOpen} title="Add Experience" onClose={() => setExperienceModalOpen(false)}>
          <form onSubmit={handleAddExperience} className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Company</label>
                <Input required value={expCompany} onChange={(e) => setExpCompany(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Role</label>
                <Input required value={expRole} onChange={(e) => setExpRole(e.target.value)} placeholder="Software Engineer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Start Date</label>
                <Input required type="date" value={expStartDate} onChange={(e) => setExpStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">End Date</label>
                <Input type="date" value={expEndDate} onChange={(e) => setExpEndDate(e.target.value)} placeholder="Present" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
              <textarea
                className="w-full min-h-[100px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                placeholder="What did you do there?"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setExperienceModalOpen(false)}>Cancel</Button>
              <Button type="submit">Add Experience</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Education Modal */}
      {educationModalOpen && (
        <Modal isOpen={educationModalOpen} title="Add Education" onClose={() => setEducationModalOpen(false)}>
          <form onSubmit={handleAddEducation} className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">School / University</label>
                <Input required value={eduSchool} onChange={(e) => setEduSchool(e.target.value)} placeholder="Stanford University" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Degree / Field</label>
                <Input required value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} placeholder="B.S. Computer Science" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Start Date</label>
                <Input required type="date" value={eduStartDate} onChange={(e) => setEduStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">End Date</label>
                <Input type="date" value={eduEndDate} onChange={(e) => setEduEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEducationModalOpen(false)}>Cancel</Button>
              <Button type="submit">Add Education</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* InMail Messaging Modal */}
      {inMailOpen && (
        <Modal isOpen={inMailOpen} title={`Send Premium InMail to @${profileUserId}`} onClose={() => setInMailOpen(false)}>
          <form onSubmit={handleSendInMail} className="space-y-4 p-2">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl p-3 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>You are using a Premium InMail credit. InMails allow you to message professionals directly even if you are not connected.</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Subject</label>
              <Input
                required
                placeholder="Collaboration Invitation / Job Opportunity"
                value={inMailSubject}
                onChange={(e) => setInMailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Message</label>
              <textarea
                required
                className="w-full min-h-[150px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Type your professional message here..."
                value={inMailBody}
                onChange={(e) => setInMailBody(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setInMailOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inMailSending}>
                {inMailSending ? "Sending..." : "Send InMail"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Write Recommendation Modal */}
      {writeRecOpen && (
        <Modal isOpen={writeRecOpen} title="Write Recommendation" onClose={() => setWriteRecOpen(false)}>
          <form onSubmit={handleWriteRecommendation} className="space-y-4 p-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Relationship</label>
              <Input
                placeholder="e.g. Managed writer directly"
                value={recRelationship}
                onChange={(e) => setRecRelationship(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Recommendation</label>
              <textarea
                required
                className="w-full min-h-[120px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Explain what makes this professional stand out..."
                value={recText}
                onChange={(e) => setRecText(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setWriteRecOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Recommendation</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Request Recommendation Modal */}
      {requestRecOpen && (
        <Modal isOpen={requestRecOpen} title="Request Recommendation" onClose={() => setRequestRecOpen(false)}>
          <form onSubmit={handleRequestRecommendation} className="space-y-4 p-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Personal Note</label>
              <textarea
                required
                className="w-full min-h-[100px] bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Could you write me a recommendation based on our work together?"
                value={reqMessage}
                onChange={(e) => setReqMessage(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setRequestRecOpen(false)}>Cancel</Button>
              <Button type="submit">Send Request</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
