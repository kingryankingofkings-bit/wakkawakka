tracker_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\implementation_tracker.md"

with open(tracker_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

updated_lines = []
count_updated = 0

for line in lines:
    stripped = line.strip()
    if stripped.startswith('|') and not stripped.startswith('|---') and 'ID | Type' not in line:
        parts = line.split('|')
        if len(parts) >= 9:
            # parts[0] is empty (before first |)
            # parts[1] is ID, parts[2] is Type, parts[3] is Category, parts[4] is Name, parts[5] is Batch
            batch = parts[5].strip()
            if batch == "Batch 3":
                # Update Status (index 6)
                parts[6] = " Implemented "
                # Update Files Changed (index 7)
                parts[7] = " src/components/feed/ContentFeedConsole.tsx, src/app/(main)/feed/page.tsx, src/app/(main)/explore/page.tsx "
                # Update Notes (index 8)
                parts[8] = " Integrated into the content feed console component and simulations "
                new_line = "|".join(parts)
                updated_lines.append(new_line)
                count_updated += 1
                continue
    updated_lines.append(line)

print(f"Updated {count_updated} lines.")

with open(tracker_path, 'w', encoding='utf-8') as f:
    f.writelines(updated_lines)

print("Saved tracker changes.")
