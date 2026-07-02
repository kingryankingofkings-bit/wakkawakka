"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProfessionalStore, useInMailStore } from "@/store/professionalStore";
import toast from "react-hot-toast";

// Sections
import { ProfileHeader } from "./professional-tab/ProfileHeader";
import { ExperienceSection } from "./professional-tab/ExperienceSection";
import { EducationSection } from "./professional-tab/EducationSection";
import { SkillsSection } from "./professional-tab/SkillsSection";
import { RecommendationsSection } from "./professional-tab/RecommendationsSection";
import { AnalyticsSection } from "./professional-tab/AnalyticsSection";

// Modals
import { EditProfileModal } from "./professional-tab/modals/EditProfileModal";
import { ExperienceModal } from "./professional-tab/modals/ExperienceModal";
import { EducationModal } from "./professional-tab/modals/EducationModal";
import { InMailModal } from "./professional-tab/modals/InMailModal";
import { WriteRecommendationModal, RequestRecommendationModal } from "./professional-tab/modals/RecommendationModals";

interface ProfessionalTabProps {
  profileUserId: string;
  isOwnProfile: boolean;
}

export function ProfessionalTab({ profileUserId, isOwnProfile }: ProfessionalTabProps) {
  const authUser = useAuthStore((s) => s.activeProfile);
  
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
      <ProfileHeader
        profileData={profileData}
        isOwnProfile={isOwnProfile}
        authUser={authUser}
        setEditProfileOpen={setEditProfileOpen}
        setInMailOpen={setInMailOpen}
        setWriteRecOpen={setWriteRecOpen}
      />

      <AnalyticsSection 
        isOwnProfile={isOwnProfile} 
        authUser={authUser}
        tier={authUser?.professionalTier || "None"} 
        userId={profileUserId}
      />

      <ExperienceSection
        profileData={profileData}
        isOwnProfile={isOwnProfile}
        setExperienceModalOpen={setExperienceModalOpen}
      />

      <EducationSection
        profileData={profileData}
        isOwnProfile={isOwnProfile}
        setEducationModalOpen={setEducationModalOpen}
      />

      <SkillsSection
        profileData={profileData}
        endorsements={endorsements}
        authUser={authUser}
        isOwnProfile={isOwnProfile}
        profileUserId={profileUserId}
        endorseSkill={endorseSkill}
        fetchProfile={fetchProfile}
      />

      <RecommendationsSection
        recommendations={recommendations}
        isOwnProfile={isOwnProfile}
        setRequestRecOpen={setRequestRecOpen}
        handleApproveRec={handleApproveRec}
      />

      {/* Modals */}
      <EditProfileModal
        editProfileOpen={editProfileOpen}
        setEditProfileOpen={setEditProfileOpen}
        headline={headline}
        setHeadline={setHeadline}
        skills={skills}
        newSkill={newSkill}
        setNewSkill={setNewSkill}
        addSkillTag={addSkillTag}
        removeSkillTag={removeSkillTag}
        handleUpdateProfile={handleUpdateProfile}
      />

      <ExperienceModal
        experienceModalOpen={experienceModalOpen}
        setExperienceModalOpen={setExperienceModalOpen}
        expCompany={expCompany}
        setExpCompany={setExpCompany}
        expRole={expRole}
        setExpRole={setExpRole}
        expStartDate={expStartDate}
        setExpStartDate={setExpStartDate}
        expEndDate={expEndDate}
        setExpEndDate={setExpEndDate}
        expDescription={expDescription}
        setExpDescription={setExpDescription}
        handleAddExperience={handleAddExperience}
      />

      <EducationModal
        educationModalOpen={educationModalOpen}
        setEducationModalOpen={setEducationModalOpen}
        eduSchool={eduSchool}
        setEduSchool={setEduSchool}
        eduDegree={eduDegree}
        setEduDegree={setEduDegree}
        eduStartDate={eduStartDate}
        setEduStartDate={setEduStartDate}
        eduEndDate={eduEndDate}
        setEduEndDate={setEduEndDate}
        handleAddEducation={handleAddEducation}
      />

      <InMailModal
        inMailOpen={inMailOpen}
        setInMailOpen={setInMailOpen}
        profileUserId={profileUserId}
        inMailSubject={inMailSubject}
        setInMailSubject={setInMailSubject}
        inMailBody={inMailBody}
        setInMailBody={setInMailBody}
        inMailSending={inMailSending}
        handleSendInMail={handleSendInMail}
      />

      <WriteRecommendationModal
        writeRecOpen={writeRecOpen}
        setWriteRecOpen={setWriteRecOpen}
        recRelationship={recRelationship}
        setRecRelationship={setRecRelationship}
        recText={recText}
        setRecText={setRecText}
        handleWriteRecommendation={handleWriteRecommendation}
      />

      <RequestRecommendationModal
        requestRecOpen={requestRecOpen}
        setRequestRecOpen={setRequestRecOpen}
        reqMessage={reqMessage}
        setReqMessage={setReqMessage}
        handleRequestRecommendation={handleRequestRecommendation}
      />
    </div>
  );
}
