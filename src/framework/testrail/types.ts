/**
 * TestRail Integration Types
 * 
 * Defines types for TestRail API integration
 */

export interface TestRailConfig {
  /** TestRail instance URL */
  url: string;
  /** User email for API authentication */
  username: string;
  /** API key for authentication */
  apiKey: string;
  /** Project ID in TestRail */
  projectId: number;
  /** Suite ID (optional, defaults to first suite) */
  suiteId?: number;
  /** Run name template */
  runName?: string;
  /** Close run after completion */
  closeRun?: boolean;
}

/**
 * TestRail Test Case
 */
export interface TestRailCase {
  id: number;
  title: string;
  sectionId: number;
  typeId: number;
  priorityId: number;
  estimate?: string;
  description?: string;
  customFields?: Record<string, any>;
  // Common custom fields for test steps
  custom_steps_separated?: string;
  custom_expected?: string;
}

/**
 * TestRail Test Run
 */
export interface TestRailRun {
  id: number;
  name: string;
  description?: string;
  createdOn: number;
  isCompleted: boolean;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  untestedCount: number;
}

/**
 * Test Result Status
 */
export enum TestStatus {
  PASSED = 1,
  BLOCKED = 2,
  UNTESTED = 3,
  RETEST = 4,
  FAILED = 5
}

/**
 * Test Result to submit
 */
export interface TestResult {
  caseId: number;
  status: TestStatus;
  comment?: string;
  elapsed?: string;
  defects?: string;
  version?: string;
}

/**
 * TestRail API Response wrapper
 */
export interface TestRailResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Test case mapping for automation
 */
export interface TestCaseMapping {
  /** Playwright test ID */
  testId: string;
  /** TestRail case ID */
  caseId: number;
  /** Test file path */
  filePath: string;
  /** Test title */
  title: string;
}

/**
 * Test run result summary
 */
export interface TestRunResult {
  runId: number;
  totalTests: number;
  passed: number;
  failed: number;
  blocked: number;
  results: TestResult[];
}

/**
 * Default TestRail configuration
 */
export const DEFAULT_TESTRAIL_CONFIG: TestRailConfig = {
  url: process.env.TESTRAIL_URL || '',
  username: process.env.TESTRAIL_USERNAME || '',
  apiKey: process.env.TESTRAIL_API_KEY || '',
  projectId: parseInt(process.env.TESTRAIL_PROJECT_ID || '1'),
  suiteId: parseInt(process.env.TESTRAIL_SUITE_ID || '1'),
  runName: process.env.TESTRAIL_RUN_NAME || 'Automated Test Run - ' + new Date().toISOString().split('T')[0],
  closeRun: false
};