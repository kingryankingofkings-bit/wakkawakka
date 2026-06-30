import json
import os

def parse_tracker():
    tracker_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\implementation_tracker.md"
    output_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\src\components\messaging\batch4Data.ts"
    
    if not os.path.exists(tracker_path):
        print(f"Error: {tracker_path} not found")
        return
        
    items = []
    with open(tracker_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.startswith("|"):
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 6 and parts[5] == "Batch 4":
                item_id = parts[1]
                item_type = parts[2]
                category = parts[3]
                name = parts[4]
                items.append({
                    "id": item_id,
                    "type": item_type,
                    "category": category,
                    "name": name
                })
                
    print(f"Parsed {len(items)} items from Batch 4.")
    
    # Generate batch4Data.ts content
    content = f"""// Generated automatically from implementation_tracker.md. Do not edit manually.
export interface Batch4Item {{
  id: string;
  type: string;
  category: string;
  name: string;
}}

export const batch4Items: Batch4Item[] = {json.dumps(items, indent=2)};
"""
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Successfully wrote {output_path}")

if __name__ == "__main__":
    parse_tracker()
