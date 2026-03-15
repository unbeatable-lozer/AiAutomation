/**
 * TestRail Sync Script
 * 
 * Synchronizes test cases between the local test files and TestRail
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { TestRailClient } from '../framework/testrail/client';
import { TestRailConfig } from '../framework/testrail/types';

dotenv.config();

// Configuration
const config: TestRailConfig = {
  url: process.env.TESTRAIL_URL || '',
  username: process.env.TESTRAIL_USERNAME || '',
  apiKey: process.env.TESTRAIL_API_KEY || '',
  projectId: parseInt(process.env.TESTRAIL_PROJECT_ID || '1'),
  suiteId: process.env.TESTRAIL_SUITE_ID ? parseInt(process.env.TESTRAIL_SUITE_ID) : undefined
};

interface TestCase {
  id: string;
  title: string;
  filePath: string;
  description?: string;
}

/**
 * Extract test cases from test files
 */
function extractTestCases(): TestCase[] {
  const testsDir = path.join(process.cwd(), 'src', 'tests');
  const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.ts'));
  
  const testCases: TestCase[] = [];
  
  for (const file of testFiles) {
    const content = fs.readFileSync(path.join(testsDir, file), 'utf-8');
    
    // Parse test titles from file
    const matches = content.matchAll(/test\(['"]([^'"]+)['"]/g);
    for (const match of matches) {
      testCases.push({
        id: match[1],
        title: match[1],
        filePath: `src/tests/${file}`
      });
    }
  }
  
  return testCases;
}

/**
 * Sync test cases to TestRail
 */
async function syncToTestRail(client: TestRailClient): Promise<void> {
  const testCases = extractTestCases();
  
  console.log(`Found ${testCases.length} test cases to sync`);
  
  // Get existing cases from TestRail
  const existingCases = await client.getCases(
    config.projectId,
    config.suiteId!
  );
  
  console.log(`Found ${existingCases.length} existing cases in TestRail`);
  
  // Find cases to add
  const existingTitles = new Set(existingCases.map(c => c.title.toLowerCase()));
  
  for (const testCase of testCases) {
    if (!existingTitles.has(testCase.title.toLowerCase())) {
      // Add new case (would need section ID in real implementation)
      console.log(`Would add: ${testCase.title}`);
    } else {
      console.log(`Skipping (exists): ${testCase.title}`);
    }
  }
}

/**
 * Generate test mapping file
 */
function generateMappingFile(testCases: TestCase[]): void {
  const mappings = testCases.map((tc, index) => ({
    testId: tc.id,
    caseId: 1000 + index, // Placeholder IDs
    filePath: tc.filePath,
    title: tc.title
  }));
  
  fs.writeFileSync(
    '.testrail-mappings.json',
    JSON.stringify({ mappings }, null, 2)
  );
  
  console.log('Generated .testrail-mappings.json');
}

/**
 * Main function
 */
async function main(): Promise<void> {
  if (!config.url || !config.username || !config.apiKey) {
    console.error('TestRail not configured. Please check your .env file.');
    process.exit(1);
  }
  
  console.log('Starting TestRail sync...');
  console.log(`Project ID: ${config.projectId}`);
  console.log(`Suite ID: ${config.suiteId}`);
  
  const client = new TestRailClient(config);
  
  try {
    // Test connection
    const connected = await client.ping();
    if (!connected) {
      console.error('Could not connect to TestRail');
      process.exit(1);
    }
    
    console.log('Connected to TestRail');
    
    // Extract test cases
    const testCases = extractTestCases();
    console.log(`Found ${testCases.length} test cases`);
    
    // Generate mapping file
    generateMappingFile(testCases);
    
    // Optionally sync to TestRail (commented out by default)
    // await syncToTestRail(client);
    
    console.log('Sync complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();