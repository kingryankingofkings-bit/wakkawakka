import re

file_path = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local\social_media_feature_bible.md"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if line.strip().startswith("## 3. "):
        print(f"Section 3 start line: {idx + 1}")
        for i in range(idx, min(len(lines), idx + 25)):
            print(f"{i+1}: {lines[i]}", end="")
    elif line.strip().startswith("## 4. "):
        print(f"\nSection 4 start line: {idx + 1}")
        for i in range(idx, min(len(lines), idx + 25)):
            print(f"{i+1}: {lines[i]}", end="")
