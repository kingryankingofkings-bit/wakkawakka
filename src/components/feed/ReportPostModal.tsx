"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiClient";
import toast from "react-hot-toast";

interface ReportPostModalProps {
  postId: string;
  authorUsername: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportPostModal({
  postId,
  authorUsername,
  isOpen,
  onClose,
}: ReportPostModalProps) {
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportText, setReportText] = useState("");

  const handleSubmit = async () => {
    try {
      const response = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          targetId: postId,
          targetType: "POST",
          reason: reportReason,
          description: reportText,
        }),
      });

      if (response.ok) {
        toast.success(
          "Thank you for reporting. Our moderators will review this post shortly.",
        );
      } else {
        toast.error("Failed to submit report");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit report");
    }
    onClose();
    setReportText("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Post"
      size="md"
    >
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Select a reason for reporting this post by @{authorUsername}. We
          review all reports within 24 hours.
        </p>
        <div className="space-y-2">
          {["SPAM", "HARASSMENT", "INAPPROPRIATE", "OTHER"].map((reason) => (
            <label
              key={reason}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                reportReason === reason
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="reportReason"
                value={reason}
                checked={reportReason === reason}
                onChange={() => setReportReason(reason)}
                className="accent-primary h-4 w-4"
              />
              <span className="text-sm font-semibold capitalize text-foreground">
                {reason.toLowerCase()}
              </span>
            </label>
          ))}
        </div>

        <textarea
          placeholder="Add details (optional)..."
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        />

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="destructive">
            Submit Report
          </Button>
        </div>
      </div>
    </Modal>
  );
}
