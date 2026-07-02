const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/forum/posts/[id]/vote/route.ts',
  'src/app/api/forum/posts/[id]/crosspost/route.ts',
  'src/app/api/forum/posts/[id]/comments/route.ts',
  'src/app/api/forum/posts/[id]/award/route.ts',
  'src/app/api/forum/comments/[id]/vote/route.ts',
  'src/app/api/forum/comments/[id]/award/route.ts',
  'src/app/api/admin/reports/route.ts'
];

files.forEach(f => {
  const fullPath = path.join(__dirname, f);
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(/tx\.user\.update/g, 'tx.profile.update');
  fs.writeFileSync(fullPath, content);
});

console.log('Fixed tx.user.update');
