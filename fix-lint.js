const fs = require('fs');

async function fixLint() {
  const data = JSON.parse(fs.readFileSync('lint-results.json', 'utf16le').replace(/^\uFEFF/, ''));
  
  for (const fileResult of data) {
    if (fileResult.errorCount === 0 && fileResult.warningCount === 0) continue;
    
    // Filter for no-unused-vars
    const unusedVars = fileResult.messages.filter(m => m.ruleId === 'no-unused-vars');
    if (unusedVars.length === 0) continue;
    
    // Sort in reverse order by line and then column
    unusedVars.sort((a, b) => {
      if (a.line !== b.line) return b.line - a.line;
      return b.column - a.column;
    });

    let contentLines = fs.readFileSync(fileResult.filePath, 'utf8').split('\n');

    for (const msg of unusedVars) {
      const lineIdx = msg.line - 1;
      const colIdx = msg.column - 1;
      const lineContent = contentLines[lineIdx];
      
      // Ensure we're inserting before a valid identifier character
      if (lineContent && colIdx >= 0 && colIdx < lineContent.length) {
        contentLines[lineIdx] = lineContent.substring(0, colIdx) + '_' + lineContent.substring(colIdx);
      }
    }

    fs.writeFileSync(fileResult.filePath, contentLines.join('\n'), 'utf8');
    console.log(`Fixed ${unusedVars.length} unused vars in ${fileResult.filePath}`);
  }
}

fixLint().catch(console.error);
