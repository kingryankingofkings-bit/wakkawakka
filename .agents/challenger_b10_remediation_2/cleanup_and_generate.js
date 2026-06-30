const { execSync } = require('child_process');

console.log("My PID:", process.pid);

function cleanAndGenerate() {
  try {
    // 1. Get all node processes
    const output = execSync('powershell -Command "Get-CimInstance Win32_Process -Filter \\"name = \'node.exe\'\\" | Select-Object ProcessId, CommandLine | ConvertTo-Json"').toString();
    const processes = JSON.parse(output);

    const processesToKill = Array.isArray(processes) ? processes : [processes];

    for (const proc of processesToKill) {
      if (!proc || !proc.CommandLine) continue;
      const cmd = proc.CommandLine.toLowerCase();
      const pid = proc.ProcessId;

      // Skip ourselves and parent processes
      if (pid === process.pid) continue;

      // Check if it's a test runner, dev server, or prisma process
      if (
        cmd.includes("server.ts") ||
        cmd.includes("next") ||
        cmd.includes("prisma") ||
        cmd.includes("camera_ar_test") ||
        cmd.includes("e2e_runner") ||
        cmd.includes("jest") ||
        cmd.includes("audit")
      ) {
        try {
          execSync(`taskkill /F /PID ${pid}`);
          console.log(`Killed locking process: PID ${pid} (${proc.CommandLine.trim()})`);
        } catch (e) {
          console.log(`Failed to kill PID ${pid}: ${e.message.trim()}`);
        }
      }
    }
  } catch (err) {
    console.error("Error during cleanup:", err.message);
  }

  // 2. Immediately run prisma generate
  console.log("Running prisma generate...");
  try {
    const genOut = execSync('npx prisma generate').toString();
    console.log(genOut);
    console.log("Prisma generate completed successfully!");
    return true;
  } catch (err) {
    console.error("Prisma generate failed:", err.message);
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    return false;
  }
}

cleanAndGenerate();
