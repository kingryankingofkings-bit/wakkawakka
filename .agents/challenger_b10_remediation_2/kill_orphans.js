const { execSync } = require('child_process');

const pidsToKill = [
  5304, 6252, 21432, 18248, 9656, 15620, 8228, 6900, 9720, 18804
];

console.log("Starting cleanup of orphan processes...");
for (const pid of pidsToKill) {
  try {
    execSync(`taskkill /F /PID ${pid}`);
    console.log(`Successfully killed PID ${pid}`);
  } catch (e) {
    console.log(`PID ${pid} was already dead or could not be killed: ${e.message.trim()}`);
  }
}
console.log("Cleanup complete!");
