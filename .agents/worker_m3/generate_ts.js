const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'batch2_features.json');
const batch2 = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Update all statuses to "Implemented"
const updatedBatch2 = batch2.map(item => ({
  ...item,
  status: 'Implemented'
}));

const tsContent = `export interface FeatureItem {
  id: string;
  type: string;
  category: string;
  name: string;
  batch: string;
  status: string;
}

export const BATCH2_FEATURES: FeatureItem[] = ${JSON.stringify(updatedBatch2, null, 2)};
`;

const outputPath = path.join(__dirname, '../../src/components/profile/featuresBatch2Data.ts');
fs.writeFileSync(outputPath, tsContent, 'utf8');
console.log('Successfully wrote featuresBatch2Data.ts');
