"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";

/**
 * DirectChat-style interactive flow form embedded in a message bubble.
 */
export function DirectChatFlow({ flowData }: { flowData: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  let config: { title: string; questions?: Array<{ id: string; label: string; options?: string[] }> } | null = null;
  try {
    config = JSON.parse(flowData);
  } catch {
    config = {
      title: "Flow Survey",
      questions: [
        {
          id: "1",
          label: "Are you enjoying Batch 5?",
          options: ["Yes, absolutely!", "It is great!"],
        },
      ],
    };
  }

  const handleToggle = (opt: string) => {
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
    );
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success("Flow form submitted successfully!");
  };

  return (
    <div className="bg-card text-foreground border border-border rounded-2xl p-3 my-1.5 max-w-[260px] space-y-2 text-xs shadow-sm">
      <div className="font-bold flex items-center gap-1.5 text-green-600">
        <span>💬</span> {config?.title}
      </div>
      {submitted ? (
        <div className="text-green-500 font-semibold flex items-center gap-1 py-1">
          <Check className="h-4 w-4" /> Submission Confirmed!
        </div>
      ) : (
        <div className="space-y-2">
          {config?.questions?.map((q) => (
            <div key={q.id} className="space-y-1">
              <p className="font-semibold text-muted-foreground">{q.label}</p>
              {q.options?.map((opt: string) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 cursor-pointer py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => handleToggle(opt)}
                    className="rounded border-border text-green-600 focus:ring-green-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ))}
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors mt-2"
          >
            Submit Flow Form
          </button>
        </div>
      )}
    </div>
  );
}
