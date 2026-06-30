with open("prisma/schema.prisma", "r", encoding="utf-8") as f:
    content = f.read()

import re
# Print relations of User model to check if any other fields exist
user_match = re.search(r"model\s+User\s+{[^}]+}", content)
if user_match:
    lines = user_match.group(0).split("\n")
    print("=== User Model Fields related to audio/spotify/podcast/playlist ===")
    for line in lines:
        if any(k in line.lower() for k in ["audio", "voice", "podcast", "room", "spotify", "playlist", "sound", "track"]):
            print(line.strip())
