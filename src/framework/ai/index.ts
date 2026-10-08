/**
 * AI Testing Module
 *
 * Exports all AI-powered testing features. The LLM provider is selected by
 * configuration (see ./config.ts), not by this module.
 */

export * from './types';
export * from './config';
export * from './llm-client';
export { AIElementFinder } from './element-finder';
export { AIVisualTester } from './visual-tester';

// Re-export default for convenience
import { AIElementFinder } from './element-finder';
import { AIVisualTester } from './visual-tester';
import { createLlmClient } from './llm-client';
import { AIConfig } from './types';
import { DEFAULT_AI_CONFIG } from './config';

export default {
  AIElementFinder,
  AIVisualTester,
  DEFAULT_AI_CONFIG,
  createLlmClient
};

// Factory function to create AI testing utilities
export function createAITesting(page: any, context: any, config?: Partial<AIConfig>) {
  return {
    elementFinder: new AIElementFinder(page, config),
    visualTester: new AIVisualTester(page, context, config)
  };
}
