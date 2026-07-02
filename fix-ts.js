const fs = require('fs');

const logContent = fs.readFileSync('C:\\Users\\Kingr\\.gemini\\antigravity-ide\\brain\\d48cbb00-0b87-46db-b7f2-2a2e3806b641\\.system_generated\\tasks\\task-317.log', 'utf8');
const lines = logContent.split('\n');

for (const line of lines) {
  const match = line.match(/^(.+?)\((\d+),(\d+)\): error TS\d+: (.*)/);
  if (match) {
    const file = match[1];
    const lineNum = parseInt(match[2], 10) - 1;
    const msg = match[4];
    
    const _matches = msg.match(/'(_\w+)'/g);
    if (_matches) {
      for (const m of _matches) {
        const wrongName = m.slice(1, -1); // remove quotes
        const rightName = wrongName.substring(1); // remove _
        
        if (fs.existsSync(file)) {
          let fileContent = fs.readFileSync(file, 'utf8').split('\n');
          if (fileContent[lineNum] && fileContent[lineNum].includes(wrongName)) {
            // Only replace whole words
            const regex = new RegExp('\\b' + wrongName + '\\b', 'g');
            fileContent[lineNum] = fileContent[lineNum].replace(regex, rightName);
            fs.writeFileSync(file, fileContent.join('\n'), 'utf8');
            console.log(`Fixed ${wrongName} -> ${rightName} in ${file}:${lineNum + 1}`);
          }
        }
      }
    }
  }
}
