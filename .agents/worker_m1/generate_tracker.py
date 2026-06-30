import re
import os

feature_bible_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\social_media_feature_bible.md"
tracker_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\implementation_tracker.md"

# Define category to batch mapping based on PROJECT.md milestones
category_batch_map = {
    "Account Settings & Authentication": "Batch 1",
    "Privacy, Security & Safety": "Batch 1",
    "Interpersonal & Community Engagement": "Batch 2",
    "Content Creation & Editing": "Batch 3",
    "Content Discovery & Search": "Batch 3",
    "Notifications & Time Management": "Batch 3",
    "Direct Messaging & Communication": "Batch 4",
    "Monetization & E-Commerce": "Batch 5",
    "Analytics, Business & Creator Tools": "Batch 5",
    "Developer APIs & Integrations": "Batch 5"
}

with open(feature_bible_path, "r", encoding="utf-8") as f:
    content = f.read()

# Locate the starts of Sections 3, 4, 5, and 6
sec3_match = re.search(r"^## 3\. Master Combined Feature List", content, re.MULTILINE)
sec4_match = re.search(r"^## 4\. Feature Improvement Proposals", content, re.MULTILINE)
sec5_match = re.search(r"^## 5\. 100\+ Unique Innovations", content, re.MULTILINE)
sec6_match = re.search(r"^## 6\. Appendix", content, re.MULTILINE)

sec3_content = content[sec3_match.start():sec4_match.start()]
sec4_content = content[sec4_match.start():sec5_match.start()]
sec5_content = content[sec5_match.start():sec6_match.start()]

# Parse Section 3 (Features)
sec3_parts = re.split(r"^####\s+", sec3_content, flags=re.MULTILINE)
features = []
for p in sec3_parts[1:]:
    lines = p.strip().split("\n")
    title_line = lines[0]
    title_match = re.match(r"^(\d+)\.\s+(.*)$", title_line)
    if not title_match:
        continue
    num, name = title_match.groups()
    category = None
    for line in lines[1:]:
        line_str = line.strip()
        if line_str.startswith("- **Category**:"):
            category = line_str.replace("- **Category**:", "").strip()
            break
    features.append({
        "id": f"F-{num}",
        "type": "Feature",
        "category": category,
        "name": name,
        "batch": category_batch_map.get(category, "")
    })

# Parse Section 4 (Improvements)
sec4_lines = sec4_content.split("\n")
improvements = []
current_category = None
for line in sec4_lines:
    line_stripped = line.strip()
    if line_stripped.startswith("### Category:"):
        current_category = line_stripped.replace("### Category:", "").strip()
    elif line_stripped.startswith("#### "):
        title_line = line_stripped.replace("#### ", "").strip()
        title_match = re.match(r"^(\d+)\.\s+Wakka Wakka Improvement:\s+(.*)$", title_line)
        if title_match:
            num, name = title_match.groups()
            improvements.append({
                "id": f"IMP-{num}",
                "type": "Improvement",
                "category": current_category,
                "name": name,
                "batch": category_batch_map.get(current_category, "")
            })

# Parse Section 5 (Innovations)
sec5_lines = sec5_content.split("\n")
innovations = []
current_category = None
for line in sec5_lines:
    line_stripped = line.strip()
    if line_stripped.startswith("### Category:"):
        current_category = line_stripped.replace("### Category:", "").strip()
    elif line_stripped.startswith("#### "):
        title_line = line_stripped.replace("#### ", "").strip()
        title_match = re.match(r"^(\d+)\.\s+(.*)$", title_line)
        if title_match:
            num, name = title_match.groups()
            innovations.append({
                "id": f"INN-{num}",
                "type": "Innovation",
                "category": current_category,
                "name": name,
                "batch": category_batch_map.get(current_category, "")
            })

# Verify counts
print(f"Parsed features: {len(features)}")
print(f"Parsed improvements: {len(improvements)}")
print(f"Parsed innovations: {len(innovations)}")
total_entries = len(features) + len(improvements) + len(innovations)
print(f"Total parsed: {total_entries}")

assert len(features) == 1082, f"Expected 1082 features, got {len(features)}"
assert len(improvements) == 1082, f"Expected 1082 improvements, got {len(improvements)}"
assert len(innovations) == 100, f"Expected 100 innovations, got {len(innovations)}"
assert total_entries == 2264, f"Expected 2264 entries, got {total_entries}"

# Generate implementation_tracker.md content
tracker_content = [
    "# Wakka Wakka Implementation Tracker",
    "",
    "This tracker maintains the implementation and verification status of all features, improvements, and innovations.",
    "",
    "| ID | Type | Category | Name | Batch | Status | Files Changed | Notes |",
    "|---|---|---|---|---|---|---|---|",
]

all_entries = features + improvements + innovations
for entry in all_entries:
    # Ensure any pipe characters in Name or Category are escaped or not breaking markdown table
    name_clean = entry["name"].replace("|", "\\|")
    cat_clean = entry["category"].replace("|", "\\|")
    tracker_content.append(
        f"| {entry['id']} | {entry['type']} | {cat_clean} | {name_clean} | {entry['batch']} | Not Started | | |"
    )

tracker_content.append("") # End with newline

# Write implementation_tracker.md
with open(tracker_path, "w", encoding="utf-8") as f:
    f.write("\n".join(tracker_content))

print(f"Successfully generated {tracker_path} with {total_entries} entries.")
