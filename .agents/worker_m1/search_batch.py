import os
import re

root_dir = r"C:\Users\Kingr\OneDrive\Documents\wakkawakka-local"
for file in os.listdir(root_dir):
    if file.endswith(".md") or file.endswith(".json") or file.endswith(".js") or file.endswith(".ts"):
        path = os.path.join(root_dir, file)
        if os.path.isdir(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                matches = list(re.finditer(r"\bbatch\b", content, re.IGNORECASE))
                if matches:
                    print(f"File {file}: found {len(matches)} occurrences")
                    for m in matches[:5]:
                        start = max(0, m.start() - 40)
                        end = min(len(content), m.end() + 40)
                        snippet = content[start:end].replace('\n', ' ')
                        print(f"  Snippet: ... {snippet} ...")
        except Exception as e:
            print(f"Error reading {file}: {e}")
