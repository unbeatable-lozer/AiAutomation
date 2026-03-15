/**
 * AI Test Automation Framework
 * 
 * A modern web test automation framework with AI capabilities
 * and TestRail integration.
 * 
 * @package ai-web-test-framework
 * @version 1.0.0
 */

// Re-export all modules
export * from './ai';
export * from './testrail';

// Import for side effects (registering the reporter)
import './testrail/reporter';

/**
 * Framework configuration
 */
export interface FrameworkConfig {
  /** Base URL for tests */
  baseUrl: string;
  /** Browser to use */
  browser: 'chromium' | 'firefox' | 'webkit';
  /** Enable headless mode */
  headless: boolean;
  /** Enable AI features */
  enableAI: boolean;
  /** TestRail configuration */
  testrail?: {
    url: string;
    username: string;
    apiKey: string;
    projectId: number;
    suiteId?: number;
  };
}

/**
 * Default framework configuration
 */
export const DEFAULT_CONFIG: FrameworkConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  browser: (process.env.BROWSER as any) || 'chromium',
  headless: process.env.HEADLESS !== 'false',
  enableAI: process.env.ENABLE_AI === 'true'
};

/**
 * Create a new page fixture with AI capabilities
 * This is used internally by the framework
 */
export function createAIContext(page: any, context: any) {
  const { createAITesting } = require('./ai');
  return createAITesting(page, context);
}

export default {
  DEFAULT_CONFIG,
  createAIContext
};