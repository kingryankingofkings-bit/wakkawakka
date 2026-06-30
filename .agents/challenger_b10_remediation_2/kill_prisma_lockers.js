const { execSync } = require('child_process');

const pids = [16708, 16324, 19144, 19348, 15620, 16936, 20628];

console.log("Killing processes locking Prisma binaries...");
for (const pid of pids) {
  try {
    execSync(`taskkill /F /PID ${pid}`);
    console.log(`Killed PID ${pid}`);
  } catch (e) {
    console.log(`Could not kill PID ${pid}: ${e.message.trim()}`);
  }
}
console.log("Done!");
