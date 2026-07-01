import type { Message } from "@/types";

/**
 * Group messages by calendar date for display with date dividers.
 */
export function groupMessagesByDate(
  messages: Message[],
): Array<{ dateLabel: string; msgs: Message[] }> {
  const groups: Array<{ dateLabel: string; msgs: Message[] }> = [];
  let currentLabel = "";

  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const label = isToday
      ? "Today"
      : isYesterday
        ? "Yesterday"
        : d.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          });

    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ dateLabel: label, msgs: [] });
    }
    groups[groups.length - 1].msgs.push(msg);
  }

  return groups;
}

/**
 * Simple Base64 "encryption" for demo E2EE mode.
 */
export function encryptText(text: string): string {
  const encoded = btoa(unescape(encodeURIComponent(text)));
  return `[E2EE-AES-GCM]:${encoded}`;
}
