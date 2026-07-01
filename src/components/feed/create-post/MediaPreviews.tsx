import { X } from "lucide-react";

interface PreviewItem {
  url: string;
  altText: string;
}

interface MediaPreviewsProps {
  previews: PreviewItem[];
  onPreviewsChange: (previews: PreviewItem[]) => void;
  tab: "Post" | "Reel" | "Story";
}

export function MediaPreviews({
  previews,
  onPreviewsChange,
  tab,
}: MediaPreviewsProps) {
  if (previews.length === 0) return null;

  return (
    <div className="space-y-3">
      {previews.map((preview, i) => (
        <div
          key={i}
          className="flex gap-3 items-start bg-muted/30 border border-border p-2 rounded-xl"
        >
          <div className="relative rounded-lg overflow-hidden h-20 w-20 bg-muted shrink-0">
            {tab === "Reel" ||
            preview.url.endsWith(".mp4") ||
            preview.url.endsWith(".webm") ||
            (preview.url.startsWith("blob:") &&
              preview.url.includes("video")) ? (
              <video
                src={preview.url}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={preview.url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            <button
              onClick={() => onPreviewsChange(previews.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Alt Text (Accessibility)
            </label>
            <input
              type="text"
              placeholder="Describe this image/video for screen readers..."
              value={preview.altText}
              onChange={(e) => {
                const updated = [...previews];
                updated[i] = { ...updated[i], altText: e.target.value };
                onPreviewsChange(updated);
              }}
              className="w-full mt-1 h-8 px-2 border border-border bg-background text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
