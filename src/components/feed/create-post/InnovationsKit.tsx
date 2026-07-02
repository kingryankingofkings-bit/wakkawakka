import { cn } from "@/lib/utils";

interface InnovationsKitProps {
  btsUrl: string | null;
  onBtsUrlChange: (_url: string | null) => void;
  greenScreenBg: string | null;
  onGreenScreenBgChange: (_bg: string | null) => void;
}

export function InnovationsKit({
  btsUrl,
  onBtsUrlChange,
  greenScreenBg,
  onGreenScreenBgChange,
}: InnovationsKitProps) {
  return (
    <div className="border border-border bg-muted/20 p-2.5 rounded-xl space-y-2 text-xs">
      <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
        Innovations Kit (BTS & Green Screen)
      </p>
      <div className="flex gap-2">
        <button
          onClick={() =>
            onBtsUrlChange(
              btsUrl ? null : "https://www.w3schools.com/html/mov_bbb.mp4",
            )
          }
          className={cn(
            "px-2.5 py-1 rounded-lg border border-border font-semibold transition-all active:scale-95",
            btsUrl
              ? "bg-primary text-white border-primary"
              : "bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          🎬 {btsUrl ? "BTS Attached" : "Attach 3s BTS snippet"}
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-semibold">
            Green Screen:
          </span>
          {["Beach Sunset", "Cyberpunk Neon", "Space Nebula"].map((bg) => (
            <button
              key={bg}
              onClick={() =>
                onGreenScreenBgChange(greenScreenBg === bg ? null : bg)
              }
              className={cn(
                "px-2 py-0.5 rounded text-[10px] border border-border transition-all active:scale-95",
                greenScreenBg === bg
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-card hover:bg-muted text-muted-foreground",
              )}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
