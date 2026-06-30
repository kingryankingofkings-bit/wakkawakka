const { execSync } = require('child_process');

console.log("Current Process PID:", process.pid);
try {
  const output = execSync('powershell -Command "Get-CimInstance Win32_Process -Filter \\"name = \'node.exe\'\\" | Select-Object ProcessId, ParentProcessId, CommandLine | Format-List"').toString();
  console.log(output);
} catch (e) {
  console.error("Failed to run Get-CimInstance:", e.message);
}
