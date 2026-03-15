/**
 * TestRail Reporter
 * 
 * Custom Playwright reporter that reports test results to TestRail
 */

import {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult
} from '@playwright/test/reporter';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { TestRailClient } from './client';
import { TestRailConfig, TestStatus, TestResult as TestResultType, TestCaseMapping, DEFAULT_TESTRAIL_CONFIG } from './types';

dotenv.config();

// Store test case mappings from test annotations
const caseMappings: Map<string, TestCaseMapping> = new Map();

/**
 * Custom TestRail reporter for Playwright
 */
class TestRailReporter implements Reporter {
  private client: TestRailClient | null = null;
  private config: TestRailConfig;
  private runId: number | null = null;
  private results: TestResultType[] = [];
  private testMappings: Map<string, number> = new Map();

  constructor() {
    this.config = {
      ...DEFAULT_TESTRAIL_CONFIG,
      url: process.env.TESTRAIL_URL || '',
      username: process.env.TESTRAIL_USERNAME || '',
      apiKey: process.env.TESTRAIL_API_KEY || '',
      projectId: parseInt(process.env.TESTRAIL_PROJECT_ID || '0'),
      suiteId: process.env.TESTRAIL_SUITE_ID ? parseInt(process.env.TESTRAIL_SUITE_ID) : undefined,
      runName: process.env.TESTRAIL_RUN_NAME,
      closeRun: process.env.TESTRAIL_CLOSE_RUN === 'true'
    };
  }

  /**
   * Initialize the reporter
   */
  async onBegin(config: FullConfig, suite: Suite): Promise<void> {
    // Check if TestRail is configured
    if (!this.config.url || !this.config.username || !this.config.apiKey) {
      console.log('TestRail not configured, skipping reporter');
      return;
    }

    try {
      this.client = new TestRailClient(this.config);
      
      // Test connection
      const connected = await this.client.ping();
      if (!connected) {
        console.warn('Could not connect to TestRail');
        return;
      }

      console.log(`Connected to TestRail: ${this.config.url}`);
      
      // Load test case mappings from file if exists
      this.loadMappings();
      
      // Create a new test run
      const runName = this.config.runName || `Automated Run - ${new Date().toISOString()}`;
      const run = await this.client.createRun({
        name: runName,
        description: `Automated test run from AI Test Framework\n\nTotal tests: ${suite.allTests().length}`,
        includeAll: true
      });
      
      this.runId = run.id;
      console.log(`Created TestRail run: ${run.id} - ${run.name}`);
      
    } catch (error) {
      console.warn('Failed to initialize TestRail reporter:', error);
      this.client = null;
    }
  }

  /**
   * Handle test result
   */
  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    if (!this.client || !this.runId) {
      return;
    }

    // Get test case ID from test metadata or mapping
    const testId = this.getTestId(test);
    const caseId = this.testMappings.get(testId) || this.findCaseId(test.title);

    if (!caseId) {
      console.log(`No TestRail case mapping for: ${test.title}`);
      return;
    }

    // Map Playwright status to TestRail status
    const status = this.mapStatus(result.status);
    
    // Build comment with test details
    const comment = this.buildComment(test, result);
    
    // Add elapsed time
    const elapsed = this.formatElapsed(result.duration);

    const testResult: TestResultType = {
      caseId,
      status,
      comment,
      elapsed
    };

    this.results.push(testResult);
  }

  /**
   * Handle end of all tests
   */
  async onEnd(result: FullResult): Promise<void> {
    if (!this.client || !this.runId) {
      return;
    }

    try {
      // Submit results in batches
      const batchSize = 100;
      for (let i = 0; i < this.results.length; i += batchSize) {
        const batch = this.results.slice(i, i + batchSize);
        await this.client.addResults(this.runId, batch);
      }

      console.log(`Submitted ${this.results.length} test results to TestRail run ${this.runId}`);

      // Close the run if configured
      if (this.config.closeRun) {
        await this.client.closeRun(this.runId);
        console.log(`Closed TestRail run ${this.runId}`);
      }

    } catch (error) {
      console.error('Failed to submit results to TestRail:', error);
    }
  }

  /**
   * Get test ID from test
   */
  private getTestId(test: TestCase): string {
    // Try to get from test.annotations
    const caseIdAnnotation = test.annotations.find(a => a.type === 'caseId');
    if (caseIdAnnotation) {
      return caseIdAnnotation.description || '';
    }

    // Fall back to test title
    return test.title;
  }

  /**
   * Find case ID from test title
   */
  private findCaseId(title: string): number | undefined {
    // Check in loaded mappings
    for (const [testId, caseId] of this.testMappings) {
      if (title.includes(testId) || testId.includes(title)) {
        return caseId;
      }
    }
    return undefined;
  }

  /**
   * Map Playwright status to TestRail status
   */
  private mapStatus(status: string): TestStatus {
    switch (status) {
      case 'passed':
        return TestStatus.PASSED;
      case 'failed':
        return TestStatus.FAILED;
      case 'skipped':
      case 'pending':
        return TestStatus.UNTESTED;
      default:
        return TestStatus.UNTESTED;
    }
  }

  /**
   * Build comment for test result
   */
  private buildComment(test: TestCase, result: TestResult): string {
    const lines: string[] = [];
    
    lines.push(`**Test:** ${test.title}`);
    lines.push(`**Status:** ${result.status}`);
    lines.push(`**Duration:** ${result.duration}ms`);
    
    if (result.errors.length > 0) {
      lines.push(`\\n**Errors:**`);
      for (const error of result.errors) {
        lines.push(`- ${error.message}`);
      }
    }
    
    if (result.stdout.length > 0) {
      lines.push(`\\n**Output:**`);
      lines.push('```');
      lines.push(result.stdout.join('\\n'));
      lines.push('```');
    }

    // Add retry information if applicable
    if (result.status === 'failed' && result.errors.length > 0) {
      lines.push(`\\n**Note:** Test failed on first attempt`);
    }
    
    return lines.join('\\n');
  }

  /**
   * Format elapsed time
   */
  private formatElapsed(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Load test case mappings from file
   */
  private loadMappings(): void {
    const mappingsPath = path.join(process.cwd(), '.testrail-mappings.json');
    
    if (fs.existsSync(mappingsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'));
        for (const mapping of data.mappings || []) {
          this.testMappings.set(mapping.testId, mapping.caseId);
        }
      } catch (e) {
        console.warn('Failed to load test case mappings:', e);
      }
    }
  }
}

// Export the reporter
export default TestRailReporter;

// Helper function to annotate tests with TestRail case IDs
export function caseId(caseId: number) {
  return {
    type: 'caseId',
    description: String(caseId)
  };
}