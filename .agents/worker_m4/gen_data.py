import re
import json
import os

tracker_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\implementation_tracker.md"
output_dir = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\src\components\feed"
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "batch3Data.ts")

with open(tracker_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

batch3_entries = []
for line in lines:
    if line.strip().startswith('|') and not line.strip().startswith('|---'):
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 6:
            item_id, item_type, category, name, batch, status = parts[:6]
            if batch == "Batch 3":
                if item_type in ("Feature", "Innovation"):
                    batch3_entries.append({
                        "id": item_id,
                        "type": item_type,
                        "category": category,
                        "name": name,
                    })

print(f"Total entries found: {len(batch3_entries)}")

ts_content = f"""// Generated automatically from implementation_tracker.md. Do not edit manually.
export interface Batch3Item {{
  id: string;
  type: 'Feature' | 'Innovation';
  category: string;
  name: string;
}}

export const batch3Items: Batch3Item[] = {json.dumps(batch3_entries, indent=2)};
"""

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Written {len(batch3_entries)} entries to {output_path}")
