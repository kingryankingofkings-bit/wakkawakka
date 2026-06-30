const fs = require('fs');
const path = require('path');

const trackerPath = path.join(__dirname, '../../implementation_tracker.md');
const content = fs.readFileSync(trackerPath, 'utf8');
const lines = content.split('\n');

let updatedCount = 0;
const newLines = lines.map(line => {
  if (line.includes('| Batch 2 |')) {
    const parts = line.split('|');
    if (parts.length >= 8) {
      parts[6] = ' Implemented ';
      parts[7] = ' src/components/profile/ProfileCommunityConsole.tsx, src/app/(main)/communities/page.tsx, src/components/profile/EditProfileModal.tsx ';
      parts[8] = ' Integrated into the profiles & communities console component and simulations ';
      updatedCount++;
      return parts.join('|');
    }
  }
  return line;
});

fs.writeFileSync(trackerPath, newLines.join('\n'), 'utf8');
console.log(`Successfully updated ${updatedCount} Batch 2 rows in implementation_tracker.md`);
