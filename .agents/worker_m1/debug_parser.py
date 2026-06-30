import re

file_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\social_media_feature_bible.md"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Locate the starts of Sections 3, 4, 5, and 6
sec3_match = re.search(r"^## 3\. Master Combined Feature List", content, re.MULTILINE)
sec4_match = re.search(r"^## 4\. Feature Improvement Proposals", content, re.MULTILINE)
sec5_match = re.search(r"^## 5\. 100\+ Unique Innovations", content, re.MULTILINE)
sec6_match = re.search(r"^## 6\. Appendix", content, re.MULTILINE)

sec3_start = sec3_match.start() if sec3_match else -1
sec4_start = sec4_match.start() if sec4_match else -1
sec5_start = sec5_match.start() if sec5_match else -1
sec6_start = sec6_match.start() if sec6_match else -1

print(f"Starts: Sec3={sec3_start}, Sec4={sec4_start}, Sec5={sec5_start}, Sec6={sec6_start}")

# Section 3 content
sec3_content = content[sec3_start:sec4_start]
# Section 4 content
sec4_content = content[sec4_start:sec5_start]
# Section 5 content
sec5_content = content[sec5_start:sec6_start]

# Parse Section 3
# Find all #### titles
sec3_titles = re.findall(r"^####\s+(\d+)\.\s+(.*)$", sec3_content, re.MULTILINE)
print(f"Section 3 unique features count: {len(sec3_titles)}")
if sec3_titles:
    print(f"  First: {sec3_titles[0]}")
    print(f"  Last: {sec3_titles[-1]}")

# Parse Section 4
sec4_titles = re.findall(r"^####\s+(\d+)\.\s+Wakka Wakka Improvement:\s+(.*)$", sec4_content, re.MULTILINE)
print(f"Section 4 unique improvements count: {len(sec4_titles)}")
if sec4_titles:
    print(f"  First: {sec4_titles[0]}")
    print(f"  Last: {sec4_titles[-1]}")

# Parse Section 5
sec5_titles = re.findall(r"^####\s+(\d+)\.\s+(.*)$", sec5_content, re.MULTILINE)
print(f"Section 5 unique innovations count: {len(sec5_titles)}")
if sec5_titles:
    print(f"  First: {sec5_titles[0]}")
    print(f"  Last: {sec5_titles[-1]}")
