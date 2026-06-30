tracker_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\implementation_tracker.md"

with open(tracker_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

batch3_entries = []
for line in lines:
    if line.strip().startswith('|') and not line.strip().startswith('|---'):
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 6:
            item_id, item_type, category, name, batch, status = parts[:6]
            if batch == "Batch 3":
                batch3_entries.append((item_id, item_type, category, name))

from collections import Counter
counts = Counter((item_type, category) for _, item_type, category, _ in batch3_entries)
for k, v in sorted(counts.items()):
    print(f"{k}: {v}")

print("Total Features + Innovations:", sum(v for k, v in counts.items() if k[0] in ('Feature', 'Innovation')))
print("Total Features + Improvements:", sum(v for k, v in counts.items() if k[0] in ('Feature', 'Improvement')))
