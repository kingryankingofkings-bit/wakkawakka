import re

file_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\social_media_feature_bible.md"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Split into sections
sec3_match = re.search(r"^## 3\. Master Combined Feature List", content, re.MULTILINE)
sec4_match = re.search(r"^## 4\. Feature Improvement Proposals", content, re.MULTILINE)
sec5_match = re.search(r"^## 5\. 100\+ Unique Innovations", content, re.MULTILINE)
sec6_match = re.search(r"^## 6\. Appendix", content, re.MULTILINE)

sec3_content = content[sec3_match.start():sec4_match.start()]
sec4_content = content[sec4_match.start():sec5_match.start()]
sec5_content = content[sec5_match.start():sec6_match.start()]

def parse_section_3(sec_text):
    parts = re.split(r"^####\s+", sec_text, flags=re.MULTILINE)
    entries = []
    for p in parts[1:]:
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
        entries.append({"num": num, "name": name, "category": category})
    return entries

sec3_parsed = parse_section_3(sec3_content)

def parse_section_4(sec_text):
    current_category = None
    lines_split = sec_text.split("\n")
    entries = []
    for line in lines_split:
        line_stripped = line.strip()
        if line_stripped.startswith("### Category:"):
            current_category = line_stripped.replace("### Category:", "").strip()
        elif line_stripped.startswith("#### "):
            title_line = line_stripped.replace("#### ", "").strip()
            title_match = re.match(r"^(\d+)\.\s+Wakka Wakka Improvement:\s+(.*)$", title_line)
            if title_match:
                num, name = title_match.groups()
                entries.append({"num": num, "name": name, "category": current_category})
    return entries

sec4_parsed = parse_section_4(sec4_content)

def parse_section_5(sec_text):
    current_category = None
    lines_split = sec_text.split("\n")
    entries = []
    for line in lines_split:
        line_stripped = line.strip()
        if line_stripped.startswith("### Category:"):
            current_category = line_stripped.replace("### Category:", "").strip()
        elif line_stripped.startswith("#### "):
            title_line = line_stripped.replace("#### ", "").strip()
            title_match = re.match(r"^(\d+)\.\s+(.*)$", title_line)
            if title_match:
                num, name = title_match.groups()
                entries.append({"num": num, "name": name, "category": current_category})
    return entries

sec5_parsed = parse_section_5(sec5_content)

cats_sec3 = set(e["category"] for e in sec3_parsed)
cats_sec4 = set(e["category"] for e in sec4_parsed)
cats_sec5 = set(e["category"] for e in sec5_parsed)

print("Unique categories in Sec 3:", sorted(list(cats_sec3)))
print("Unique categories in Sec 4:", sorted(list(cats_sec4)))
print("Unique categories in Sec 5:", sorted(list(cats_sec5)))
