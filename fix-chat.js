const fs = require('fs');

const path = "src/components/messaging/ChatWindow.tsx";
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('import { apiFetch } from "@/lib/apiClient"')) {
  code = code.replace(
    'import { motion } from "framer-motion";',
    'import { motion } from "framer-motion";\nimport { apiFetch } from "@/lib/apiClient";'
  );
}

// Replace all fetch() inside ChatWindow with apiFetch()
code = code.replace(/await fetch\(/g, "await apiFetch(");

fs.writeFileSync(path, code);
console.log("ChatWindow.tsx updated to use apiFetch");
