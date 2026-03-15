/**
 * TestRail API Client
 * 
 * Provides methods for interacting with TestRail's API
 */

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import {
  TestRailConfig,
  TestRailCase,
  TestRailRun,
  TestResult,
  TestStatus,
  TestCaseMapping
} from './types';

export class TestRailClient {
  private config: TestRailConfig;
  private baseUrl: string;
  private auth: string;

  constructor(config: TestRailConfig) {
    this.config = config;
    
    // Remove trailing slash from URL
    const baseUrl = config.url.replace(/\/$/, '');
    this.baseUrl = `${baseUrl}/index.php?/api/v2`;
    
    // Create Basic Auth header
    const authString = `${config.username}:${config.apiKey}`;
    this.auth = Buffer.from(authString).toString('base64');
  }

  /**
   * Make HTTP request to TestRail API
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${path}`);
      const isHttps = url.protocol === 'https:';
      const transport = isHttps ? https : http;

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Test-Framework/1.0'
        }
      };

      const req = transport.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
       res.on('end', () => {
         try {
           const parsed = JSON.parse(data);
           
           if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
             resolve(parsed as T);
           } else {
             // Provide more specific error messages for common issues
             if (res.statusCode === 401) {
               const authError = parsed.error || 'Authentication failed';
               let suggestion = '';
               if (authError.includes('invalid or missing user/password') || authError.includes('session cookie')) {
                 suggestion = '\n\nTroubleshooting tips:\n1. Verify your TestRail URL is correct (should be https://yourcompany.testrail.io)\n2. Ensure your username is your full email address\n3. Check that your API key is correct (generated in TestRail under My Settings > API Keys)\n4. Make sure API access is enabled for your user in TestRail administration\n5. Try generating a new API key in TestRail if you suspect the current one is compromised';
               }
               reject(new Error(`${authError}${suggestion}`));
             } else {
               reject(new Error(parsed.error || `HTTP ${res.statusCode}: ${data}`));
             }
           }
         } catch (e) {
           reject(new Error(`Failed to parse response: ${data}`));
         }
       });
      });

      req.on('error', (e) => {
        reject(e);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: number): Promise<any> {
    return this.request('GET', `/get_project/${projectId}`);
  }

  /**
   * Get test suite by ID
   */
  async getSuite(projectId: number, suiteId: number): Promise<any> {
    return this.request(`/get_suite/${suiteId}`, '');
  }

  /**
   * Get all test cases from a suite
   */
  async getCases(projectId: number, suiteId: number): Promise<TestRailCase[]> {
    const response = await this.request<any[]>(
      'GET',
      `/get_cases/${projectId}&suite_id=${suiteId}`
    );
    return response;
  }

  /**
   * Get all sections in a suite
   */
  async getSections(projectId: number, suiteId: number): Promise<any[]> {
    return this.request(`GET`, `/get_sections/${projectId}&suite_id=${suiteId}`);
  }

  /**
   * Add a new test case
   */
  async addCase(sectionId: number, caseData: {
    title: string;
    typeId?: number;
    priorityId?: number;
    estimate?: string;
    description?: string;
  }): Promise<TestRailCase> {
    return this.request('POST', `/add_case/${sectionId}`, caseData);
  }

  /**
   * Update an existing test case
   */
  async updateCase(caseId: number, caseData: Partial<{
    title: string;
    typeId: number;
    priorityId: number;
    estimate: string;
    description: string;
  }>): Promise<TestRailCase> {
    return this.request('POST', `/update_case/${caseId}`, caseData);
  }

  /**
   * Delete a test case
   */
  async deleteCase(caseId: number): Promise<void> {
    return this.request('POST', `/delete_case/${caseId}`);
  }

  /**
   * Create a new test run
   */
  async createRun(runData: {
    name: string;
    description?: string;
    milestoneId?: number;
    assignedtoId?: number;
    includeAll?: boolean;
    caseIds?: number[];
  }): Promise<TestRailRun> {
    return this.request('POST', `/add_run/${this.config.projectId}`, {
      ...runData,
      suite_id: this.config.suiteId
    });
  }

  /**
   * Get test run by ID
   */
  async getRun(runId: number): Promise<TestRailRun> {
    return this.request('GET', `/get_run/${runId}`);
  }

  /**
   * Get all test runs for a project
   */
  async getRuns(projectId: number, filters?: {
    createdAfter?: number;
    createdBefore?: number;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let path = `/get_runs/${projectId}`;
    const params: string[] = [];
    
    if (filters) {
      if (filters.createdAfter) params.push(`created_after=${filters.createdAfter}`);
      if (filters.createdBefore) params.push(`created_before=${filters.createdBefore}`);
      if (filters.limit) params.push(`limit=${filters.limit}`);
      if (filters.offset) params.push(`offset=${filters.offset}`);
    }
    
    if (params.length > 0) {
      path += '&' + params.join('&');
    }
    
    return this.request('GET', path);
  }

  /**
   * Add test results for cases in a run
   */
  async addResults(runId: number, results: TestResult[]): Promise<any> {
    return this.request('POST', `/add_results/${runId}`, {
      results
    });
  }

  /**
   * Add a single test result
   */
  async addResult(runId: number, caseId: number, result: Omit<TestResult, 'caseId'>): Promise<any> {
    return this.request('POST', `/add_result/${runId}/${caseId}`, result);
  }

  /**
   * Close a test run
   */
  async closeRun(runId: number): Promise<TestRailRun> {
    return this.request('POST', `/close_run/${runId}`);
  }

  /**
   * Get test run results
   */
  async getResults(runId: number): Promise<any[]> {
    return this.request('GET', `/get_results/${runId}`);
  }

  /**
   * Get tests in a run
   */
  async getTests(runId: number): Promise<any[]> {
    return this.request('GET', `/get_tests/${runId}`);
  }

  /**
   * Get case types
   */
  async getCaseTypes(): Promise<any[]> {
    return this.request('GET', '/get_case_types');
  }

  /**
   * Get priorities
   */
  async getPriorities(): Promise<any[]> {
    return this.request('GET', '/get_priorities');
  }

  /**
   * Get statuses
   */
  async getStatuses(): Promise<any[]> {
    return this.request('GET', '/get_statuses');
  }

  /**
   * Check if TestRail is accessible
   */
  async ping(): Promise<boolean> {
    try {
      await this.request('GET', '/get_user');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert Playwright test status to TestRail status
   */
  static mapStatus(testStatus: string): TestStatus {
    switch (testStatus.toLowerCase()) {
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
}

export default TestRailClient;