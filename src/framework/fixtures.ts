/**
 * Playwright Fixtures
 * 
 * Provides AI-powered testing utilities as Playwright fixtures
 */

import { test as base, expect as baseExpect, Page, BrowserContext } from '@playwright/test';
import * as dotenv from 'dotenv';
import { AIElementFinder } from './ai/element-finder';
import { AIVisualTester } from './ai/visual-tester';
import { AIConfig } from './ai/types';
import { resolveAiConfig } from './ai/config';

dotenv.config();

/**
 * Extended test fixture with AI capabilities
 */
export interface AITestFixture {
  /** Find elements using natural language */
  ai: {
    /** Find an element by description */
    findElement: (description: string, options?: {
      role?: string;
      context?: string;
    }) => Promise<any>;
    
    /** Compare screenshot with baseline */
    compareScreenshot: (name: string, options?: {
      selector?: string;
      threshold?: number;
      updateBaseline?: boolean;
    }) => Promise<any>;
    
    /** Analyze the current page */
    analyzePage: () => Promise<any>;
    
    /** Heal a broken locator */
    healLocator: (locator: string) => Promise<string | null>;
  };
}

// Export base test and expect
export { baseExpect as expect };

/**
 * Create AI test fixture
 */
export const test = base.extend<AITestFixture>({
  ai: async ({ page, context }, use) => {
    // Create AI utilities
    // Resolved per fixture so environment changes are picked up at run time
    const aiConfig: AIConfig = resolveAiConfig();

    const elementFinder = new AIElementFinder(page, aiConfig);
    const visualTester = new AIVisualTester(page, context, aiConfig);

    const ai = {
      findElement: async (description: string, options?: { role?: string; context?: string }) => {
        return elementFinder.findElement({ description, ...options });
      },

      compareScreenshot: async (name: string, options?: {
        selector?: string;
        threshold?: number;
        updateBaseline?: boolean;
      }) => {
        return visualTester.compareWithBaseline(name, options);
      },

      analyzePage: async () => {
        return elementFinder.analyzePage();
      },

      healLocator: async (locator: string) => {
        return elementFinder.healLocator(locator);
      }
    };

    await use(ai);
  }
});

export default { test, expect: baseExpect };