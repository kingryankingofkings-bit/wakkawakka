const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../implementation_tracker.md");
const content = fs.readFileSync(filePath, "utf8");
const lines = content.split("\n");

const batch2 = [];
for (const line of lines) {
  if (line.includes("Batch 2")) {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length >= 7) {
      const id = parts[1];
      const type = parts[2];
      const category = parts[3];
      const name = parts[4];
      const batch = parts[5];
      const status = parts[6];
      batch2.push({ id, type, category, name, batch, status });
    }
  }
}

const outputPath = path.join(__dirname, "batch2_features.json");
fs.writeFileSync(outputPath, JSON.stringify(batch2, null, 2), "utf8");
console.log("Total found:", batch2.length);
